import { test } from "node:test"
import assert from "node:assert/strict"
import { readSavedSessionCalibrationGuidance } from "../src/lib/saved-session-calibration"

test("saved session calibration asks for a feedback type before review", () => {
  assert.equal(
    readSavedSessionCalibrationGuidance({ hasFeedback: false, hasFeedbackNote: false }),
    "Choose one feedback type before this session is useful for Carl/Maria calibration.",
  )
})

test("saved session calibration distinguishes feedback type from usable note evidence", () => {
  assert.equal(
    readSavedSessionCalibrationGuidance({ hasFeedback: true, hasFeedbackNote: false }),
    "Feedback type is saved. If something specific felt right or wrong, add a short note so the review has usable evidence.",
  )
})

test("saved session calibration points noted sessions to admin review", () => {
  assert.equal(
    readSavedSessionCalibrationGuidance({ hasFeedback: true, hasFeedbackNote: true }),
    "Calibration note is saved. Admin review can now mark this ready, voice/source issue, prompt issue, or golden example.",
  )
})

test("saved session calibration recognizes ready and blocker reviews", () => {
  assert.equal(
    readSavedSessionCalibrationGuidance({ hasFeedback: true, hasFeedbackNote: true, latestReviewLabel: "ready" }),
    "This session is marked ready. It can be used as a golden example for future calibration checks.",
  )
  assert.equal(
    readSavedSessionCalibrationGuidance({
      hasFeedback: true,
      hasFeedbackNote: true,
      latestReviewLabel: "voice_wrong",
      latestReviewSeverity: "pilot_blocker",
    }),
    "This session is marked as needing attention. Resolve the review issue before treating it as calibration evidence.",
  )
})
