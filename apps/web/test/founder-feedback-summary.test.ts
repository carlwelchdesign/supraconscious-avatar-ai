import { test } from "node:test"
import assert from "node:assert/strict"
import { readFounderFeedbackSummary } from "../src/lib/founder-feedback-summary"

test("founder dashboard has no feedback summary before feedback is saved", () => {
  assert.equal(readFounderFeedbackSummary({ hasFeedback: false, hasFeedbackNote: false }), null)
})

test("founder dashboard distinguishes feedback type from written note", () => {
  assert.equal(
    readFounderFeedbackSummary({ hasFeedback: true, hasFeedbackNote: false }),
    "Feedback type saved. Add a note only when there is a specific detail to capture.",
  )
  assert.equal(
    readFounderFeedbackSummary({ hasFeedback: true, hasFeedbackNote: true }),
    "Calibration note saved. It helps tune the guide; it does not automatically retrain it.",
  )
})
