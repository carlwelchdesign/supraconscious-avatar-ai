import { prisma } from "@inner-avatar/db"
import { isFounderCalibrationUser, runFounderCalibrationSetupReport } from "@inner-avatar/ai"
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
  const setupReport = founderCalibrationMode ? await runFounderCalibrationSetupReport() : null
  const founderParticipant = setupReport?.participants.find((participant) => participant.userId === user.id || participant.email === user.email.toLowerCase())
  const suggestedScenario = founderParticipant?.scenarioStatus.find((item) => !item.completed)?.scenario
  const suggestedCalibrationScenario = suggestedScenario === "freeform" ? undefined : suggestedScenario
  const founderSessionCount = founderParticipant?.sessionCount ?? 0
  const founderFeedbackNoteCount = founderParticipant?.feedbackNoteCount ?? 0
  const needsFounderFirstSessionGuide = founderCalibrationMode && Boolean(founderParticipant) && founderSessionCount === 0
  const needsFounderFeedbackNote = founderCalibrationMode && Boolean(founderParticipant) && founderSessionCount > 0 && founderFeedbackNoteCount === 0
  const guideStage = Math.min(Math.max(user.avatarStage ?? 1, 1), 5)

  return (
    <JournalWorkspace
      avatarStage={guideStage as 1 | 2 | 3 | 4 | 5}
      thresholdPrompt={thresholdPrompt}
      todayLabel={todayLabel}
      founderCalibrationMode={founderCalibrationMode}
      suggestedCalibrationScenario={suggestedCalibrationScenario}
      needsFounderFirstSessionGuide={needsFounderFirstSessionGuide}
      needsFounderFeedbackNote={needsFounderFeedbackNote}
      founderFeedbackNoteHref={founderParticipant?.latestSessionHref ?? null}
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
