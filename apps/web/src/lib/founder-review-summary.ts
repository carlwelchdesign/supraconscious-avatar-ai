type FounderReviewSummaryInput = {
  reviewLabel?: string | null
  reviewSeverity?: string | null
}

export function readFounderReviewSummary(input: FounderReviewSummaryInput) {
  if (!input.reviewLabel) return null

  if (input.reviewSeverity === "pilot_blocker") {
    return "Admin review marked this session as needing attention before it becomes useful calibration evidence."
  }

  if (input.reviewLabel === "ready") {
    return "Admin review marked this as ready. It can serve as a golden example for future guide tuning."
  }

  if (input.reviewLabel === "voice_good" || input.reviewLabel === "source_good") {
    return "Admin review marked this session as strong calibration evidence."
  }

  if (input.reviewLabel === "voice_wrong") return "Admin review marked a voice issue for prompt tuning."
  if (input.reviewLabel === "source_unsupported") return "Admin review marked a source grounding issue."
  if (input.reviewLabel === "embodiment_weak") return "Admin review marked the embodiment guidance as weak."
  if (input.reviewLabel === "too_generic") return "Admin review marked this response as too generic."
  if (input.reviewLabel === "too_intense") return "Admin review marked this response as too intense."
  if (input.reviewLabel === "prompt_regression") return "Admin review marked a prompt regression."

  return `Admin review marked this session: ${input.reviewLabel.replaceAll("_", " ")}.`
}
