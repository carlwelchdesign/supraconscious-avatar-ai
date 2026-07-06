import { createHash } from "node:crypto"

export type AccountDeletionAuditMetadataInput = {
  email: string
  stripeCleanup: {
    stripeConfigured: boolean
    customerDeleted: boolean
    canceledSubscriptions: number
  }
}

export function hashAccountEmailForAudit(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}

export function buildAccountDeletionAuditMetadata(input: AccountDeletionAuditMetadataInput) {
  return {
    emailHash: hashAccountEmailForAudit(input.email),
    selfService: true,
    stripeCleanup: input.stripeCleanup,
  }
}
