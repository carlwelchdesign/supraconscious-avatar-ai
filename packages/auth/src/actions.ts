"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  requestEmailVerificationByEmail,
  requestEmailVerificationForUser,
  requestPasswordResetByEmail,
  resetPasswordWithToken,
  verifyEmailWithToken,
} from "./account-email"
import { verifyBotChallenge } from "./bot-challenge"
import { createSession, destroySession, hashPassword, verifyPassword } from "./session"
import { linkFounderParticipantIfConfigured, readPostLoginRedirect } from "./redirects"
import { isAuthRateLimited, recordAuthFailure } from "./rate-limit"
import { choosePostAuthRedirect, choosePostRegistrationRedirect } from "./safe-redirect"
import { prisma } from "@inner-avatar/db"
import type { UserRole } from "@inner-avatar/types"
import { readSupportedLanguageFromHeader } from "@inner-avatar/types/language"

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  next: z.string().optional(),
  website: z.string().optional(),
  "cf-turnstile-response": z.string().optional(),
})

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
  next: z.string().optional(),
  website: z.string().optional(),
  "cf-turnstile-response": z.string().optional(),
})

const RequestEmailSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  website: z.string().optional(),
  "cf-turnstile-response": z.string().optional(),
})

const VerifyEmailSchema = z.object({
  token: z.string().trim().min(20, "Verification token is required."),
  website: z.string().optional(),
  "cf-turnstile-response": z.string().optional(),
})

const RequestPasswordResetSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  website: z.string().optional(),
  "cf-turnstile-response": z.string().optional(),
})

const ResetPasswordSchema = z.object({
  token: z.string().trim().min(20, "Password reset token is required."),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  confirmPassword: z.string().min(8, "Confirm your new password."),
  website: z.string().optional(),
  "cf-turnstile-response": z.string().optional(),
}).refine((value) => value.password === value.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
})

export type AuthActionState = {
  error?: string
  success?: string
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    await recordAuthFailure("register")
    return { error: parsed.error.issues[0]?.message ?? "Could not create account." }
  }
  if (isBotSubmission(parsed.data.website)) {
    await recordAuthFailure("register", parsed.data.email)
    return { error: "Could not create account." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    await recordAuthFailure("register", parsed.data.email)
    return { error: botChallengeMessage() }
  }
  if (await isAuthRateLimited("register", parsed.data.email)) {
    return { error: rateLimitMessage("register") }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    })

    if (existing) {
      await recordAuthFailure("register", parsed.data.email)
      return { error: "An account already exists for this email." }
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: roleForEmail(parsed.data.email),
        preferredLanguage: await readRequestLanguage(),
      },
    })
    await linkFounderParticipantIfConfigured(user.id, user.email)
    try {
      await requestEmailVerificationForUser(user)
    } catch {
      // Email delivery should not prevent account creation.
    }

    await createSession(user.id, "web")
  } catch (error) {
    await recordAuthFailure("register", parsed.data.email)
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect(choosePostRegistrationRedirect(parsed.data.next))
}

async function readRequestLanguage() {
  const headerStore = await headers()
  return readSupportedLanguageFromHeader(headerStore.get("accept-language"))
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    await recordAuthFailure("web_login")
    return { error: parsed.error.issues[0]?.message ?? "Could not sign in." }
  }
  if (isBotSubmission(parsed.data.website)) {
    await recordAuthFailure("web_login", parsed.data.email)
    return { error: "Email or password is incorrect." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    await recordAuthFailure("web_login", parsed.data.email)
    return { error: botChallengeMessage() }
  }
  if (await isAuthRateLimited("web_login", parsed.data.email)) {
    return { error: rateLimitMessage("web_login") }
  }
  let redirectTo = "/dashboard"

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      await recordAuthFailure("web_login", parsed.data.email)
      return { error: "Email or password is incorrect." }
    }

    const expectedRole = roleForEmail(user.email)
    const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
      ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
      : user

    await createSession(effectiveUser.id, "web")
    redirectTo = choosePostAuthRedirect(await readPostLoginRedirect(effectiveUser), parsed.data.next)
  } catch (error) {
    await recordAuthFailure("web_login", parsed.data.email)
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect(redirectTo)
}

export async function logoutAction() {
  await destroySession("web")
  redirect("/")
}

export async function adminLoginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    await recordAuthFailure("admin_login")
    return { error: parsed.error.issues[0]?.message ?? "Could not sign in." }
  }
  if (isBotSubmission(parsed.data.website)) {
    await recordAuthFailure("admin_login", parsed.data.email)
    return { error: "Email or password is incorrect." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    await recordAuthFailure("admin_login", parsed.data.email)
    return { error: botChallengeMessage() }
  }
  if (await isAuthRateLimited("admin_login", parsed.data.email)) {
    return { error: rateLimitMessage("admin_login") }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      await recordAuthFailure("admin_login", parsed.data.email)
      return { error: "Email or password is incorrect." }
    }

    const expectedRole = roleForEmail(user.email)
    const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
      ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
      : user

    if (effectiveUser.role !== "admin" && effectiveUser.role !== "super_admin") {
      await recordAuthFailure("admin_login", parsed.data.email)
      return { error: "Admin access is required." }
    }

    await createSession(effectiveUser.id, "admin")
  } catch (error) {
    await recordAuthFailure("admin_login", parsed.data.email)
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/")
}

export async function adminLogoutAction() {
  await destroySession("admin")
  redirect("/login")
}

export async function requestEmailVerificationAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = RequestEmailSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    await recordAuthFailure("email_verification")
    return { error: parsed.error.issues[0]?.message ?? "Could not request verification." }
  }
  if (isBotSubmission(parsed.data.website)) {
    await recordAuthFailure("email_verification", parsed.data.email)
    return { error: "Could not request verification." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    await recordAuthFailure("email_verification", parsed.data.email)
    return { error: botChallengeMessage() }
  }
  if (await isAuthRateLimited("email_verification", parsed.data.email)) {
    return { error: "Too many verification requests. Please wait a few minutes and try again." }
  }

  try {
    await requestEmailVerificationByEmail(parsed.data.email)
  } catch {
    await recordAuthFailure("email_verification", parsed.data.email)
  }

  return { success: "If this account needs verification, a verification link has been sent." }
}

export async function verifyEmailAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = VerifyEmailSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not verify email." }
  }
  if (isBotSubmission(parsed.data.website)) {
    return { error: "Could not verify email." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    return { error: botChallengeMessage() }
  }

  const result = await verifyEmailWithToken(parsed.data.token)
  if (!result.verified) return { error: result.error ?? "Could not verify email." }

  return { success: "Your email is verified. You can continue using Supraconscious." }
}

export async function requestPasswordResetAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = RequestPasswordResetSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    await recordAuthFailure("password_reset")
    return { error: parsed.error.issues[0]?.message ?? "Could not request password reset." }
  }
  if (isBotSubmission(parsed.data.website)) {
    await recordAuthFailure("password_reset", parsed.data.email)
    return { error: "Could not request password reset." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    await recordAuthFailure("password_reset", parsed.data.email)
    return { error: botChallengeMessage() }
  }
  if (await isAuthRateLimited("password_reset", parsed.data.email)) {
    return { error: "Too many password reset requests. Please wait a few minutes and try again." }
  }

  try {
    await requestPasswordResetByEmail(parsed.data.email)
  } catch {
    await recordAuthFailure("password_reset", parsed.data.email)
  }

  return { success: "If an account exists for this email, a password reset link has been sent." }
}

export async function resetPasswordAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = ResetPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not reset password." }
  }
  if (isBotSubmission(parsed.data.website)) {
    return { error: "Could not reset password." }
  }
  if (!(await passesBotChallenge(parsed.data["cf-turnstile-response"]))) {
    return { error: botChallengeMessage() }
  }

  const result = await resetPasswordWithToken(parsed.data.token, parsed.data.password)
  if (!result.reset) return { error: result.error ?? "Could not reset password." }

  return { success: "Your password has been reset. Please sign in again." }
}

function authDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("does not exist in the current database")) {
    return "Account tables are not up to date. Please run the latest database migration and try again."
  }

  return "We could not process that account request. Please try again."
}

function rateLimitMessage(scope: "web_login" | "admin_login" | "register") {
  if (scope === "register") return "Too many account creation attempts. Please wait a few minutes and try again."
  return "Too many sign-in attempts. Please wait a few minutes and try again."
}

async function passesBotChallenge(token: string | undefined) {
  const challenge = await verifyBotChallenge(token)
  return challenge.ok
}

function botChallengeMessage() {
  return "Please complete the security check and try again."
}

function isBotSubmission(value: string | undefined) {
  return Boolean(value?.trim())
}

function roleForEmail(email: string): UserRole {
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase()) ? "super_admin" : "user"
}
