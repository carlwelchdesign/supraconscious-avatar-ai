import assert from "node:assert/strict"
import test from "node:test"
import { hashAccountEmailForAudit } from "../src/account-audit"
import { buildAuthRateLimitEmailKey } from "../src/rate-limit-keys"

test("auth rate-limit email keys use a hash instead of raw email", () => {
  const key = buildAuthRateLimitEmailKey("web_login", " Founder@Example.com ")

  assert.equal(key, `web_login:email_hash:${hashAccountEmailForAudit("founder@example.com")}`)
  assert.equal(key.includes("Founder@Example.com"), false)
  assert.equal(key.includes("founder@example.com"), false)
  assert.equal(key.includes("@"), false)
})
