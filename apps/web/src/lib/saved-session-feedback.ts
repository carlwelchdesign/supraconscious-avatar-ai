export const SAVED_SESSION_FEEDBACK_TYPES = [
  ["helpful", "Helpful"],
  ["not_accurate", "Not accurate"],
  ["too_intense", "Too intense"],
  ["unclear", "Unclear"],
  ["unsupported_source", "Report source issue"],
] as const

export type SavedSessionFeedbackType = (typeof SAVED_SESSION_FEEDBACK_TYPES)[number][0]

export function readInitialSavedSessionFeedbackType(founderCalibrationMode: boolean): SavedSessionFeedbackType | "" {
  return founderCalibrationMode ? "" : "helpful"
}
