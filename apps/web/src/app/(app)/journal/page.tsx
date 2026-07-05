import { prisma } from "@inner-avatar/db"
import { isFounderCalibrationUser, runFounderCalibrationJournalReadiness } from "@inner-avatar/ai"
import { JournalWorkspace } from "@/components/journal/journal-workspace"
import { requireJournalAccessPageUser } from "@/lib/journal-access"

export default async function JournalPage() {
  const user = await requireJournalAccessPageUser()

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
  const todaysPrompt = await prisma.curriculumDay.findFirst({
    where: {
      publishState: "approved_curriculum",
      month,
      day,
    },
    select: promptSelect,
  })
  const fallbackPrompt = todaysPrompt
    ? null
    : await prisma.curriculumDay.findFirst({
      where: {
        publishState: "approved_curriculum",
        month,
      },
      orderBy: { day: "asc" },
      select: promptSelect,
    },
    )
  const thresholdPrompt = todaysPrompt ?? fallbackPrompt
  const founderCalibrationMode = await isFounderCalibrationUser(user.email)
  const founderReadiness = await runFounderCalibrationJournalReadiness({
    userId: user.id,
    email: user.email,
    founderCalibrationMode,
  })
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)

  return (
    <JournalWorkspace
      avatarStage={guideStage as 1 | 2 | 3 | 4 | 5}
      thresholdPrompt={thresholdPrompt}
      todayLabel={todayLabel}
      founderCalibrationMode={founderCalibrationMode}
      suggestedCalibrationScenario={founderReadiness.suggestedCalibrationScenario ?? undefined}
      needsFounderFirstSessionGuide={founderReadiness.needsFounderFirstSessionGuide}
      needsFounderFeedbackNote={founderReadiness.needsFounderFeedbackNote}
      founderFeedbackNoteHref={founderReadiness.founderFeedbackNoteHref}
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
