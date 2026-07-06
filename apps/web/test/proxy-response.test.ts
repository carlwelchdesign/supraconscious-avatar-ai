import { test } from "node:test"
import assert from "node:assert"
import { privateProxyJsonInit } from "../src/lib/proxy-response"

test("proxy private JSON responses are explicitly non-cacheable", () => {
  const init = privateProxyJsonInit(401)

  assert.equal(init.status, 401)
  assert.equal(init.headers["Cache-Control"], "no-store, max-age=0")
})
