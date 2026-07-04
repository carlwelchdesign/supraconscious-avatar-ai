import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { isFounderCalibrationUser, runFounderCalibrationSetupReport } from "@inner-avatar/ai"
import { JournalWorkspace } from "@/components/journal/journal-workspace"
import { redirect } from "next/navigation"

export default async function JournalPage() {
  const user = await requireAppUser()
  if (!user.onboardingComplete) redirect("/onboarding")
  const today = new Date()
  const month = today.getMonth() + 1
  const day = today.getDate()
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

  return (
    <JournalWorkspace
      avatarStage={(user.avatarStage ?? 1) as 1 | 2 | 3 | 4 | 5}
      thresholdPrompt={thresholdPrompt}
      founderCalibrationMode={founderCalibrationMode}
      suggestedCalibrationScenario={suggestedCalibrationScenario}
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
