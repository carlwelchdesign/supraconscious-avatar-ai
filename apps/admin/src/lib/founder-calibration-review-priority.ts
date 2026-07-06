const NEGATIVE_FEEDBACK = new Set(["not_accurate", "too_intense", "unclear"])

export type FounderCalibrationReviewPriority = {
  rank: number
  label: string
  reason: string
}

export function readFounderCalibrationReviewPriority(input: {
  feedbackTypes: string[]
  latestReviewLabel?: string | null
  latestReviewSeverity?: string | null
  validationStatus?: string | null
  validationIssues?: string[]
}): FounderCalibrationReviewPriority {
  if (input.latestReviewSeverity === "pilot_blocker") {
    return { rank: 0, label: "Pilot blocker", reason: "This session is already marked as a blocker." }
  }

  if (input.validationStatus === "pilot_validation_failed" || (input.validationIssues?.length ?? 0) > 0) {
    return { rank: 1, label: "Validation issue", reason: "Review this before using the session as calibration evidence." }
  }

  if (input.feedbackTypes.includes("unsupported_source")) {
    return { rank: 2, label: "Source report", reason: "The founder reported a source-grounding issue." }
  }

  if (input.feedbackTypes.some((type) => NEGATIVE_FEEDBACK.has(type))) {
    return { rank: 3, label: "Negative feedback", reason: "The founder marked the reflection as inaccurate, intense, or unclear." }
  }

  if (!input.latestReviewLabel && input.feedbackTypes.length > 0) {
    return { rank: 4, label: "Needs review", reason: "Feedback exists, but no admin review has been saved yet." }
  }

  if (!input.latestReviewLabel) {
    return { rank: 5, label: "Unreviewed", reason: "No admin review has been saved yet." }
  }

  if (input.latestReviewLabel === "ready") {
    return { rank: 8, label: "Ready", reason: "This session has been marked as a reusable calibration example." }
  }

  return { rank: 7, label: "Reviewed issue", reason: "This session has an issue label and may need prompt, source, or embodiment follow-up." }
}
