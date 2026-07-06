import { test } from "node:test"
import assert from "node:assert"
import { PRIVATE_JSON_HEADERS, privateJson } from "../src/lib/private-json"

test("privateJson adds no-store cache control to JSON responses", async () => {
  const response = privateJson({ ok: true })

  assert.equal(response.headers.get("cache-control"), PRIVATE_JSON_HEADERS["Cache-Control"])
  assert.equal(response.headers.get("x-content-type-options"), PRIVATE_JSON_HEADERS["X-Content-Type-Options"])
  assert.match(response.headers.get("content-type") ?? "", /application\/json/)
  assert.deepEqual(await response.json(), { ok: true })
})

test("privateJson preserves status and overrides weaker cache headers", () => {
  const response = privateJson(
    { error: "Nope" },
    {
      status: 403,
      headers: { "Cache-Control": "public, max-age=3600", "X-Test": "kept" },
    },
  )

  assert.equal(response.status, 403)
  assert.equal(response.headers.get("cache-control"), PRIVATE_JSON_HEADERS["Cache-Control"])
  assert.equal(response.headers.get("x-content-type-options"), PRIVATE_JSON_HEADERS["X-Content-Type-Options"])
  assert.equal(response.headers.get("x-test"), "kept")
})
