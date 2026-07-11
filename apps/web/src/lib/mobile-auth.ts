import "server-only"

import { z } from "zod"
import { requestEmailVerificationForUser } from "@inner-avatar/auth/account-email"
import { PILOT_CONSENT_VERSION, OPTIONAL_PILOT_CONSENTS, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import { isAuthRateLimited, recordAuthFailure } from "@inner-avatar/auth/rate-limit"
import { linkFounderParticipantIfConfigured } from "@inner-avatar/auth/redirects"
import { createSession, destroySession, getCurrentUser, hashPassword, verifyPassword } from "@inner-avatar/auth/session"
import { emitPilotEvent } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import type { UserRole } from "@inner-avatar/types"
import { resolveSupportedLanguage } from "@inner-avatar/types/language"
import { buildMobileSessionResponse } from "./mobile-api"
import { readRequestLanguage } from "./language"

export const MobileRegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  preferredLanguage: z.string().optional(),
})

export const MobileLoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export const MobileConsentSchema = z.object({
  patternMemoryGranted: z.boolean().default(false),
})

export const MobileReflectionPreferencesSchema = z.object({
  patternMemoryEnabled: z.boolean(),
})

export const MobileLanguagePreferenceSchema = z.object({
  preferredLanguage: z.string(),
})

export async function registerMobileUser(input: z.infer<typeof MobileRegisterSchema>) {
  if (await isAuthRateLimited("register", input.email)) {
    return { ok: false as const, error: "Too many account creation attempts. Please wait a few minutes and try again.", status: 429 }
  }

  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  })

  if (existing) {
    await recordAuthFailure("register", input.email)
    return { ok: false as const, error: "An account already exists for this email.", status: 409 }
  }

  try {
    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: roleForEmail(input.email),
        preferredLanguage: resolveSupportedLanguage(input.preferredLanguage ?? await readRequestLanguage()),
      },
    })
    await linkFounderParticipantIfConfigured(user.id, user.email)
    requestEmailVerificationForUser(user).catch(() => undefined)
    await createSession(user.id, "web")

    return { ok: true as const, body: await getMobileSessionBody(user.id) }
  } catch (error) {
    await recordAuthFailure("register", input.email)
    return { ok: false as const, error: authDatabaseErrorMessage(error), status: 400 }
  }
}

export async function loginMobileUser(input: z.infer<typeof MobileLoginSchema>) {
  if (await isAuthRateLimited("web_login", input.email)) {
    return { ok: false as const, error: "Too many sign-in attempts. Please wait a few minutes and try again.", status: 429 }
  }

  const user = await prisma.user.findUnique({ where: { email: input.email } })
  if (!user || !(await verifyPassword(input.password, user.passwordHash))) {
    await recordAuthFailure("web_login", input.email)
    return { ok: false as const, error: "Email or password is incorrect.", status: 401 }
  }

  const expectedRole = roleForEmail(user.email)
  const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
    ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
    : user

  await createSession(effectiveUser.id, "web")
  return { ok: true as const, body: await getMobileSessionBody(effectiveUser.id) }
}

export async function logoutMobileUser() {
  await destroySession("web")
  return { ok: true }
}

export async function getMobileSessionBody(userId?: string) {
  const user = userId
    ? await prisma.user.findUnique({ where: { id: userId } })
    : await getCurrentUser("web")

  if (!user) return buildMobileSessionResponse({ user: null })

  const consentRecords = await getMobileConsentRecords(user.id)
  return buildMobileSessionResponse({ user, consentRecords })
}

export async function acceptMobileConsent(userId: string, input: z.infer<typeof MobileConsentSchema>) {
  await prisma.$transaction([
    ...REQUIRED_PILOT_CONSENTS.map((consentType) =>
      prisma.consentEvent.create({
        data: {
          userId,
          consentType,
          consentVersion: PILOT_CONSENT_VERSION,
          granted: true,
          metadata: { source: "mobile_onboarding" },
        },
      }),
    ),
    ...OPTIONAL_PILOT_CONSENTS.map((consentType) =>
      prisma.consentEvent.create({
        data: {
          userId,
          consentType,
          consentVersion: PILOT_CONSENT_VERSION,
          granted: input.patternMemoryGranted,
          metadata: { source: "mobile_onboarding" },
        },
      }),
    ),
    prisma.user.update({
      where: { id: userId },
      data: {
        onboardingComplete: true,
        patternMemoryEnabled: input.patternMemoryGranted,
      },
    }),
  ])

  await emitPilotEvent({
    eventName: "consent_accepted",
    userId,
    properties: {
      consentVersion: PILOT_CONSENT_VERSION,
      consentCount: REQUIRED_PILOT_CONSENTS.length + OPTIONAL_PILOT_CONSENTS.length,
      patternMemoryGranted: input.patternMemoryGranted,
      source: "mobile_onboarding",
    },
  })

  return getMobileSessionBody(userId)
}

export async function updateMobileReflectionPreferences(userId: string, input: z.infer<typeof MobileReflectionPreferencesSchema>) {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        patternMemoryEnabled: input.patternMemoryEnabled,
        safetyModeEnabled: true,
      },
    }),
    prisma.consentEvent.create({
      data: {
        userId,
        consentType: "pattern_memory",
        consentVersion: PILOT_CONSENT_VERSION,
        granted: input.patternMemoryEnabled,
        metadata: { source: "mobile_reflection_preferences" },
      },
    }),
  ])

  await emitPilotEvent({
    eventName: "consent_accepted",
    userId,
    properties: {
      consentType: "pattern_memory",
      consentVersion: PILOT_CONSENT_VERSION,
      granted: input.patternMemoryEnabled,
      source: "mobile_reflection_preferences",
    },
  })

  return getMobileSessionBody(userId)
}

export async function updateMobileLanguagePreference(userId: string, input: z.infer<typeof MobileLanguagePreferenceSchema>) {
  await prisma.user.update({
    where: { id: userId },
    data: { preferredLanguage: resolveSupportedLanguage(input.preferredLanguage) },
    select: { id: true },
  })

  return getMobileSessionBody(userId)
}

export function getMobileConsentRecords(userId: string) {
  return prisma.consentEvent.findMany({
    where: {
      userId,
      consentType: { in: [...REQUIRED_PILOT_CONSENTS, ...OPTIONAL_PILOT_CONSENTS] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      consentType: true,
      consentVersion: true,
      granted: true,
      createdAt: true,
    },
  })
}

function roleForEmail(email: string): UserRole {
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase()) ? "super_admin" : "user"
}

function authDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("does not exist in the current database")) {
    return "Account tables are not up to date. Please run the latest database migration and try again."
  }

  return "We could not process that account request. Please try again."
}
