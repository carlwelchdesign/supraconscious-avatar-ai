import { prisma } from "@inner-avatar/db"
import { getGuideStageConfigs, readGuideStageNames, runFounderCalibrationJournalReadiness } from "@inner-avatar/ai"
import { JournalWorkspace } from "@/components/journal/journal-workspace"
import { getAppCalendarDate } from "@/lib/date-format"
import { requireJournalAccessPageUser } from "@/lib/journal-access"
import { resolveWebLanguage } from "@/lib/language"

export default async function JournalPage() {
  const user = await requireJournalAccessPageUser("/journal")
  const currentLanguage = await resolveWebLanguage(user.preferredLanguage)

  const today = getAppCalendarDate()
  const month = today.month
  const day = today.day
  const todayLabel = today.label
  const promptSelect = {
    id: true,
    month: true,
    day: true,
    theme: true,
    quote: true,
    frameOfThought: true,
    socraticQuestion: true,
  } as const
  const [monthPrompts, founderReadiness, guideStages] = await Promise.all([
    prisma.curriculumDay.findMany({
      where: {
        publishState: "approved_curriculum",
        month,
      },
      orderBy: { day: "asc" },
      select: promptSelect,
    }),
    runFounderCalibrationJournalReadiness({
      userId: user.id,
      email: user.email,
    }),
    getGuideStageConfigs(prisma, currentLanguage),
  ])
  const todaysPrompt = monthPrompts.find((prompt) => prompt.day === day) ?? null
  const fallbackPrompt = todaysPrompt ? null : (monthPrompts[0] ?? null)
  const thresholdPrompt = todaysPrompt ?? fallbackPrompt
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)

  return (
    <JournalWorkspace
      avatarStage={guideStage as 1 | 2 | 3 | 4 | 5}
      stageNames={readGuideStageNames(guideStages)}
      thresholdPrompt={thresholdPrompt}
      todayLabel={todayLabel}
      founderCalibrationMode={founderReadiness.founderCalibrationMode}
      suggestedCalibrationScenario={founderReadiness.suggestedCalibrationScenario ?? undefined}
      needsFounderFirstSessionGuide={founderReadiness.needsFounderFirstSessionGuide}
      needsFounderFeedback={founderReadiness.needsFounderFeedback}
      founderFeedbackHref={founderReadiness.founderFeedbackHref}
      voicePrefs={{
        voiceEnabled: user.voiceEnabled ?? false,
        voiceAutoPlay: user.voiceAutoPlay ?? false,
        voiceGender: user.voiceGender ?? "female",
        voiceStyle: user.voiceStyle ?? "warm",
        voiceSpeed: user.voiceSpeed ?? 1.0,
      }}
    />
  )
}
