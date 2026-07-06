import { test } from "node:test"
import assert from "node:assert/strict"
import { buildSafetyRevealAuditMetadata, hashRevealedJournalTextForAudit } from "../src/lib/safety-audit"

test("safety reveal audit metadata hashes raw journal text", () => {
  const metadata = buildSafetyRevealAuditMetadata({
    safetyEventId: "safety_1",
    severity: "high",
    rawText: "private journal text",
  })

  assert.equal(metadata.safetyEventId, "safety_1")
  assert.equal(metadata.severity, "high")
  assert.equal(metadata.revealedTextHash, hashRevealedJournalTextForAudit("private journal text"))
  assert.equal(metadata.rawTextStored, false)
  assert.equal(JSON.stringify(metadata).includes("private journal text"), false)
})
