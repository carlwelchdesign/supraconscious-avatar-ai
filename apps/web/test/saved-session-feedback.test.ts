import test from "node:test"
import assert from "node:assert/strict"
import { readInitialSavedSessionFeedbackType, SAVED_SESSION_FEEDBACK_TYPES } from "../src/lib/saved-session-feedback"

test("saved session feedback requires an explicit founder calibration choice", () => {
  assert.equal(readInitialSavedSessionFeedbackType(true), "")
})

test("saved session feedback keeps helpful as the default outside founder calibration", () => {
  assert.equal(readInitialSavedSessionFeedbackType(false), "helpful")
})

test("saved session feedback exposes the pilot feedback choices", () => {
  assert.deepEqual(
    SAVED_SESSION_FEEDBACK_TYPES.map(([value]) => value),
    ["helpful", "not_accurate", "too_intense", "unclear", "unsupported_source"],
  )
})
