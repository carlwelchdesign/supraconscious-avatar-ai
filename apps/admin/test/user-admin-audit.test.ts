import { test } from "node:test"
import assert from "node:assert/strict"
import { buildAdminSessionRevocationMetadata } from "../src/lib/user-admin-audit"

test("admin session revocation audit metadata stores count and scopes only", () => {
  const metadata = buildAdminSessionRevocationMetadata({
    emailHash: "hashed-email",
    revokedSessionCount: 3,
    scopes: ["web", "admin", "web"],
  })

  assert.deepEqual(metadata, {
    emailHash: "hashed-email",
    revokedSessionCount: 3,
    sessionScopes: ["admin", "web"],
  })
  assert.equal(JSON.stringify(metadata).includes("session_token"), false)
})
