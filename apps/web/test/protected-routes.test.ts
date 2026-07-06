import { test } from "node:test"
import assert from "node:assert"
import { isProtectedAppPath } from "../src/lib/protected-routes"

test("protected routes include the canonical guide path and legacy avatar path", () => {
  assert.equal(isProtectedAppPath("/guide"), true)
  assert.equal(isProtectedAppPath("/guide/stages"), true)
  assert.equal(isProtectedAppPath("/avatar"), true)
  assert.equal(isProtectedAppPath("/avatar/stages"), true)
})

test("protected route matching does not overmatch similarly named public paths", () => {
  assert.equal(isProtectedAppPath("/guidelines"), false)
  assert.equal(isProtectedAppPath("/avatar-public"), false)
  assert.equal(isProtectedAppPath("/pricing"), false)
})

test("protected routes include journal, pattern, voice, and compatibility APIs", () => {
  assert.equal(isProtectedAppPath("/api/journal/analyze"), true)
  assert.equal(isProtectedAppPath("/api/avatar/respond"), true)
  assert.equal(isProtectedAppPath("/api/prompts/generate"), true)
  assert.equal(isProtectedAppPath("/api/patterns"), true)
  assert.equal(isProtectedAppPath("/api/voice/speak"), true)
  assert.equal(isProtectedAppPath("/api/health"), false)
})
