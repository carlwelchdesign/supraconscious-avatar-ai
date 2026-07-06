import test from "node:test"
import assert from "node:assert/strict"
import { buildHealthPayload, HEALTH_RESPONSE_HEADERS } from "../src/lib/health-response"

test("admin health response headers prevent caching and sniffing", () => {
  assert.equal(HEALTH_RESPONSE_HEADERS["Cache-Control"], "no-store, max-age=0")
  assert.equal(HEALTH_RESPONSE_HEADERS["X-Content-Type-Options"], "nosniff")
})

test("admin health payload reflects database readiness", () => {
  assert.deepEqual(buildHealthPayload("inner-avatar-admin", "ok"), {
    ok: true,
    service: "inner-avatar-admin",
    database: "ok",
  })
  assert.deepEqual(buildHealthPayload("inner-avatar-admin", "error"), {
    ok: false,
    service: "inner-avatar-admin",
    database: "error",
  })
})
