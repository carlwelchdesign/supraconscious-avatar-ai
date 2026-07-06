import test from "node:test"
import assert from "node:assert/strict"
import { buildHealthPayload, HEALTH_RESPONSE_HEADERS } from "../src/lib/health-response"

test("web health response headers prevent caching and sniffing", () => {
  assert.equal(HEALTH_RESPONSE_HEADERS["Cache-Control"], "no-store, max-age=0")
  assert.equal(HEALTH_RESPONSE_HEADERS["X-Content-Type-Options"], "nosniff")
})

test("web health payload reflects database readiness", () => {
  assert.deepEqual(buildHealthPayload("inner-avatar-web", "ok"), {
    ok: true,
    service: "inner-avatar-web",
    database: "ok",
  })
  assert.deepEqual(buildHealthPayload("inner-avatar-web", "error"), {
    ok: false,
    service: "inner-avatar-web",
    database: "error",
  })
})
