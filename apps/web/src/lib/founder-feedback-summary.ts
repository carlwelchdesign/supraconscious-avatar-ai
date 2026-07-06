export function readFounderFeedbackSummary(input: { hasFeedback: boolean; hasFeedbackNote: boolean }) {
  if (!input.hasFeedback) return null

  return input.hasFeedbackNote
    ? "Calibration note saved. It helps tune the guide; it does not automatically retrain it."
    : "Feedback type saved. Add a note only when there is a specific detail to capture."
}
