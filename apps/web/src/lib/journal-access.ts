import "server-only"

import { hasRequiredPilotConsents, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import { getCurrentUser, type AuthUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

export class JournalAccessError extends Error {
  constructor(message: string, readonly status: number, readonly code: string) {
    super(message)
  }
}

export async function requireJournalAccessUser(): Promise<NonNullable<AuthUser>> {
  const user = await getCurrentUser()
  if (!user) throw new JournalAccessError("Unauthorized", 401, "unauthorized")

  if (!user.onboardingComplete) {
    throw new JournalAccessError("Complete onboarding before using the journal.", 403, "onboarding_required")
  }

  const consentRecords = await prisma.consentEvent.findMany({
    where: {
      userId: user.id,
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

  if (!hasRequiredPilotConsents(consentRecords)) {
    throw new JournalAccessError("Complete consent before using the journal.", 403, "consent_required")
  }

  return user
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
