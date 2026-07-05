import { prisma } from "@inner-avatar/db"
import { runFounderCalibrationJournalReadiness } from "@inner-avatar/ai"
import { JournalWorkspace } from "@/components/journal/journal-workspace"
import { requireJournalAccessPageUser } from "@/lib/journal-access"

export default async function JournalPage() {
  const user = await requireJournalAccessPageUser("/journal")

  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
  const todayLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  })
  const promptSelect = {
    id: true,
    month: true,
    day: true,
    theme: true,
    quote: true,
    frameOfThought: true,
    socraticQuestion: true,
  } as const
  const [monthPrompts, founderReadiness] = await Promise.all([
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
  ])
  const todaysPrompt = monthPrompts.find((prompt) => prompt.day === day) ?? null
  const fallbackPrompt = todaysPrompt ? null : (monthPrompts[0] ?? null)
  const thresholdPrompt = todaysPrompt ?? fallbackPrompt
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)

  return (
    <JournalWorkspace
      avatarStage={guideStage as 1 | 2 | 3 | 4 | 5}
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
