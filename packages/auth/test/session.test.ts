import assert from "node:assert/strict"
import test from "node:test"
import { shouldRefreshSessionLastSeen } from "../src/session-refresh"

test("session last-seen refresh is throttled for recent requests", () => {
  const now = new Date("2026-07-05T12:00:00.000Z")

  assert.equal(shouldRefreshSessionLastSeen(null, now), true)
  assert.equal(shouldRefreshSessionLastSeen(new Date("2026-07-05T11:56:00.000Z"), now), false)
  assert.equal(shouldRefreshSessionLastSeen(new Date("2026-07-05T11:55:00.000Z"), now), true)
})
