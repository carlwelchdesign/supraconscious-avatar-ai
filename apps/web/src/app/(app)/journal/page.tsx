import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { isFounderCalibrationUser } from "@inner-avatar/ai"
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

  return (
    <JournalWorkspace
      avatarStage={(user.avatarStage ?? 1) as 1 | 2 | 3 | 4 | 5}
      thresholdPrompt={thresholdPrompt}
      founderCalibrationMode={founderCalibrationMode}
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
