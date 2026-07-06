import { createHash } from "node:crypto"

export function hashRevealedJournalTextForAudit(text: string) {
  return createHash("sha256").update(text).digest("hex")
}

export function buildSafetyRevealAuditMetadata(input: {
  safetyEventId: string
  severity: string
  rawText: string
}) {
  return {
    safetyEventId: input.safetyEventId,
    severity: input.severity,
    revealedTextHash: hashRevealedJournalTextForAudit(input.rawText),
    rawTextStored: false,
  }
}
