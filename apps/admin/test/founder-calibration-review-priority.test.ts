import test from "node:test"
import assert from "node:assert/strict"
import { readFounderCalibrationReviewPriority } from "../src/lib/founder-calibration-review-priority"

test("founder calibration review priority surfaces validation and safety blockers first", () => {
  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["helpful"],
    latestReviewLabel: "ready",
    latestReviewSeverity: "pilot_blocker",
    validationStatus: "validated",
  }).rank, 0)

  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["helpful"],
    validationStatus: "pilot_validation_failed",
  }).label, "Validation issue")
})

test("founder calibration review priority prefers source and negative feedback before routine review", () => {
  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["unsupported_source"],
    validationStatus: "validated",
  }).rank, 2)

  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["too_intense"],
    validationStatus: "validated",
  }).rank, 3)

  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["helpful"],
    validationStatus: "validated",
  }).rank, 4)
})

test("founder calibration review priority separates ready sessions from unresolved reviewed issues", () => {
  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["helpful"],
    latestReviewLabel: "ready",
    validationStatus: "validated",
  }).label, "Ready")

  assert.equal(readFounderCalibrationReviewPriority({
    feedbackTypes: ["helpful"],
    latestReviewLabel: "voice_wrong",
    validationStatus: "validated",
  }).label, "Reviewed issue")
})
