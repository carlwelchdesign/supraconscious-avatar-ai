type SavedSessionCalibrationInput = {
  hasFeedback: boolean
  hasFeedbackNote: boolean
  latestReviewLabel?: string | null
  latestReviewSeverity?: string | null
}

export function readSavedSessionCalibrationGuidance(input: SavedSessionCalibrationInput) {
  if (!input.hasFeedback) {
    return "Choose one feedback type before this session is useful for Carl/Maria calibration."
  }

  if (!input.hasFeedbackNote) {
    return "Feedback type is saved. If something specific felt right or wrong, add a short note so the review has usable evidence."
  }

  if (!input.latestReviewLabel) {
    return "Calibration note is saved. Admin review can now mark this ready, voice/source issue, prompt issue, or golden example."
  }

  if (input.latestReviewLabel === "ready" || input.latestReviewSeverity === "ready") {
    return "This session is marked ready. It can be used as a golden example for future calibration checks."
  }

  if (input.latestReviewSeverity === "pilot_blocker") {
    return "This session is marked as needing attention. Resolve the review issue before treating it as calibration evidence."
  }

  return "This session has feedback and review evidence. Use the latest review label to decide the next prompt, source, or embodiment fix."
}
