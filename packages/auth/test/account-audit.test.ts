import assert from "node:assert/strict"
import test from "node:test"
import { buildAccountEmailAuditMetadata, hashAccountEmailForAudit } from "../src/account-audit"

test("account email audit metadata stores hashes instead of raw emails", () => {
  const metadata = buildAccountEmailAuditMetadata({
    email: " Founder@Example.com ",
    sentToEmail: "FOUNDER@example.com",
    delivered: true,
    provider: "resend",
    reason: "queued",
  })

  assert.equal(metadata.emailHash, hashAccountEmailForAudit("founder@example.com"))
  assert.equal(metadata.sentToEmailHash, hashAccountEmailForAudit("founder@example.com"))
  assert.equal(metadata.delivered, true)
  assert.equal(metadata.provider, "resend")
  assert.equal(metadata.reason, "queued")
  assert.equal(JSON.stringify(metadata).includes("Founder@Example.com"), false)
  assert.equal(JSON.stringify(metadata).includes("founder@example.com"), false)
})
