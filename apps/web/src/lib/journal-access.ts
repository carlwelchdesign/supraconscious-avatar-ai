import "server-only"

import { redirect } from "next/navigation"
import { REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import { getCurrentUser, type AuthUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { evaluateJournalAccess } from "./journal-access-policy"

export class JournalAccessError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message)
  }
}

export async function requireJournalAccessUser(): Promise<NonNullable<AuthUser>> {
  const user = await getCurrentUser()
  if (!user) {
    throw new JournalAccessError("Unauthorized", 401, "unauthorized")
  }

  const consentRecords = await getRequiredConsentRecords(user.id)

  throwAccess(evaluateJournalAccess(user, consentRecords))

  return user
}

export async function requireJournalAccessPageUser(nextPath = ""): Promise<NonNullable<AuthUser>> {
  const user = await getCurrentUser()
  if (!user) redirect("/login")

  const consentRecords = await getRequiredConsentRecords(user.id)
  const decision = evaluateJournalAccess(user, consentRecords)

  if (!decision.allowed) {
    redirect(buildOnboardingRedirect(decision.code === "onboarding_required" ? null : "consent_required", nextPath))
  }

  return user
}

function buildOnboardingRedirect(error: string | null, nextPath: string) {
  const params = new URLSearchParams()
  if (error) params.set("error", error)
  if (isSafeOnboardingNextPath(nextPath)) params.set("next", nextPath)
  const query = params.toString()
  return query ? `/onboarding?${query}` : "/onboarding"
}

function isSafeOnboardingNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return false
  const [path] = value.split(/[?#]/)
  return path === "/journal" || path.startsWith("/journal/")
}

export function getJournalAccessError(error: unknown) {
  if (error instanceof JournalAccessError) {
    return {
      error: error.message,
      code: error.code,
      status: error.status,
    }
  }

  return null
}

function throwAccess(decision: ReturnType<typeof evaluateJournalAccess>) {
  if (!decision.allowed) {
    throw new JournalAccessError(decision.message, decision.status, decision.code)
  }
}

function getRequiredConsentRecords(userId: string) {
  return prisma.consentEvent.findMany({
    where: {
      userId,
      consentType: { in: [...REQUIRED_PILOT_CONSENTS] },
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
