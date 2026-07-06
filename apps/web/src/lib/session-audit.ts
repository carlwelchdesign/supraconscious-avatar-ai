import { createHash } from "node:crypto"

type SessionAuditScope = "web" | "admin" | string

export function hashSessionIdForAudit(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("hex")
}

export function buildSessionRevocationAuditMetadata(input: {
  sessionId: string
  scope: SessionAuditScope | null | undefined
  currentSession: boolean
}) {
  return {
    sessionIdHash: hashSessionIdForAudit(input.sessionId),
    scope: input.scope ?? "unknown",
    currentSession: input.currentSession,
  }
}

export function buildAllSessionsRevocationAuditMetadata(input: {
  revokedCount: number
  scopes: Array<SessionAuditScope | null | undefined>
}) {
  return {
    revokedCount: input.revokedCount,
    scopes: Array.from(new Set(input.scopes.map((scope) => scope ?? "unknown"))).sort(),
  }
}
