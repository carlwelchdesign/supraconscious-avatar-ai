"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSession, destroySession, hashPassword, verifyPassword } from "./session"
import { prisma } from "@inner-avatar/db"
import type { UserRole } from "@inner-avatar/types"

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export type AuthActionState = {
  error?: string
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not create account." }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    })

    if (existing) {
      return { error: "An account already exists for this email." }
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: roleForEmail(parsed.data.email),
      },
    })
    await linkFounderParticipantIfConfigured(user.id, user.email)

    await createSession(user.id, "web")
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/onboarding")
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not sign in." }
  }
  let redirectTo = "/dashboard"

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { error: "Email or password is incorrect." }
    }

    const expectedRole = roleForEmail(user.email)
    const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
      ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
      : user

    await createSession(effectiveUser.id, "web")
    redirectTo = await readPostLoginRedirect(effectiveUser)
  } catch (error) {
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
    return { error: parsed.error.issues[0]?.message ?? "Could not sign in." }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { error: "Email or password is incorrect." }
    }

    const expectedRole = roleForEmail(user.email)
    const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
      ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
      : user

    if (effectiveUser.role !== "admin" && effectiveUser.role !== "super_admin") {
      return { error: "Admin access is required." }
    }

    await createSession(effectiveUser.id, "admin")
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/")
}

export async function adminLogoutAction() {
  await destroySession("admin")
  redirect("/login")
}

async function readPostLoginRedirect(user: { id: string; email: string; onboardingComplete: boolean }) {
  if (!user.onboardingComplete) return "/onboarding"

  const founderParticipant = await linkFounderParticipantIfConfigured(user.id, user.email)
  if (!founderParticipant) return "/dashboard"

  const councilSessionCount = await prisma.councilSession.count({
    where: { userId: user.id },
  })
  return councilSessionCount === 0 ? "/journal" : "/dashboard"
}

async function linkFounderParticipantIfConfigured(userId: string, email: string) {
  try {
    const participant = await prisma.founderCalibrationParticipant.findFirst({
      where: { email, status: "active" },
      select: { id: true, userId: true },
    })
    if (!participant) return null
    if (participant.userId === userId) return participant

    await prisma.founderCalibrationParticipant.update({
      where: { id: participant.id },
      data: { userId },
    })
    return participant
  } catch (error) {
    if (isMissingFounderParticipantTable(error)) return null
    throw error
  }
}

function authDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("does not exist in the current database")) {
    return "Account tables are not up to date. Please run the latest database migration and try again."
  }

  return "We could not process that account request. Please try again."
}

function isMissingFounderParticipantTable(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as { code?: unknown; message?: unknown }
  return record.code === "P2021" || (typeof record.message === "string" && record.message.includes("FounderCalibrationParticipant"))
}

function roleForEmail(email: string): UserRole {
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase()) ? "super_admin" : "user"
}
