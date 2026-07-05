import "server-only"

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

  throwAccess(evaluateJournalAccess(user, consentRecords))

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

function throwAccess(decision: ReturnType<typeof evaluateJournalAccess>) {
  if (!decision.allowed) {
    throw new JournalAccessError(decision.message, decision.status, decision.code)
  }
}
