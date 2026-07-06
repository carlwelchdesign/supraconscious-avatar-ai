import { test } from "node:test"
import assert from "node:assert/strict"
import {
  buildAllSessionsRevocationAuditMetadata,
  buildSessionRevocationAuditMetadata,
  hashSessionIdForAudit,
} from "../src/lib/session-audit"

test("single session revocation audit metadata hashes session id", () => {
  const metadata = buildSessionRevocationAuditMetadata({
    sessionId: "session_raw_id",
    scope: "web",
    currentSession: true,
  })

  assert.equal(metadata.sessionIdHash, hashSessionIdForAudit("session_raw_id"))
  assert.equal(metadata.scope, "web")
  assert.equal(metadata.currentSession, true)
  assert.equal(JSON.stringify(metadata).includes("session_raw_id"), false)
})

test("all session revocation audit metadata stores counts and scopes only", () => {
  const metadata = buildAllSessionsRevocationAuditMetadata({
    revokedCount: 3,
    scopes: ["web", "admin", "web", null],
  })

  assert.deepEqual(metadata, {
    revokedCount: 3,
    scopes: ["admin", "unknown", "web"],
  })
})
