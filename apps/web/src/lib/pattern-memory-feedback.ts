export type PatternMemoryFeedbackType =
  | "helpful"
  | "not_accurate"
  | "too_intense"
  | "suppress"
  | "restore"

export function buildPatternMemoryVisibilityUpdate({
  feedbackType,
  patternMemoryId,
  userId,
}: {
  feedbackType: PatternMemoryFeedbackType
  patternMemoryId: string
  userId: string
}) {
  if (feedbackType === "suppress") {
    return {
      where: { id: patternMemoryId, userId },
      data: { active: false },
    }
  }

  if (feedbackType === "restore") {
    return {
      where: { id: patternMemoryId, userId },
      data: { active: true },
    }
  }

  return null
}
