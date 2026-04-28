import { prisma } from "@/lib/db"

const LEVEL_WINDOW = 5
const LEVEL_REQUIRED = 3

// Cumulative entries with suggestedLevel >= nextStage required to advance avatarStage.
// Index 0 = stage 1→2, index 1 = stage 2→3, etc.
// Echo breaks with regular use; Inner Author takes sustained deep reflection.
const STAGE_THRESHOLDS = [5, 12, 22, 35]

export type ProgressionResult = {
  levelChanged: boolean
  stageChanged: boolean
  newLevel: number
  newStage: number
  previousLevel: number
  previousStage: number
}

export async function checkAndAdvanceProgression(
  userId: string,
  currentLevel: number,
  avatarStage: number,
): Promise<ProgressionResult> {
  const previousLevel = currentLevel
  const previousStage = avatarStage

  // currentLevel: sliding window over last N analyses
  // 3 of the last 5 entries must show deeper reflection to advance one step
  const recentAnalyses = await prisma.entryAnalysis.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: LEVEL_WINDOW,
    select: { suggestedLevel: true },
  })

  let newLevel = currentLevel
  if (recentAnalyses.length >= LEVEL_REQUIRED && currentLevel < 5) {
    const aboveCount = recentAnalyses.filter((a) => a.suggestedLevel > currentLevel).length
    if (aboveCount >= LEVEL_REQUIRED) {
      newLevel = Math.min(5, currentLevel + 1)
    }
  }

  // avatarStage: cumulative count of entries reaching the next stage threshold
  // Counts all time — stage advancement is a milestone, not a streak
  let newStage = avatarStage
  if (avatarStage < 5) {
    const threshold = STAGE_THRESHOLDS[avatarStage - 1]
    const qualifyingCount = await prisma.entryAnalysis.count({
      where: { userId, suggestedLevel: { gte: avatarStage + 1 } },
    })
    if (qualifyingCount >= threshold) {
      newStage = avatarStage + 1
    }
  }

  const levelChanged = newLevel !== previousLevel
  const stageChanged = newStage !== previousStage

  if (levelChanged || stageChanged) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        ...(levelChanged && { currentLevel: newLevel }),
        ...(stageChanged && { avatarStage: newStage }),
      },
    })
  }

  return { levelChanged, stageChanged, newLevel, newStage, previousLevel, previousStage }
}
