import { createHash } from "node:crypto"

export function hashAccountEmailForAudit(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}

export function buildAccountEmailAuditMetadata(input: {
  email: string
  sentToEmail?: string | null
  delivered?: boolean
  provider?: string
  reason?: string
}) {
  return {
    emailHash: hashAccountEmailForAudit(input.email),
    ...(input.sentToEmail ? { sentToEmailHash: hashAccountEmailForAudit(input.sentToEmail) } : {}),
    ...(typeof input.delivered === "boolean" ? { delivered: input.delivered } : {}),
    ...(input.provider ? { provider: input.provider } : {}),
    ...(input.reason ? { reason: input.reason } : {}),
  }
}
