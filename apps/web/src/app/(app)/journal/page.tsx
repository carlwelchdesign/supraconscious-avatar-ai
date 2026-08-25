import { prisma } from "@inner-avatar/db"
import { runFounderCalibrationJournalReadiness } from "@inner-avatar/ai"
import { JournalWorkspace } from "@/components/journal/journal-workspace"
import { getAppCalendarDate } from "@/lib/date-format"
import { requireJournalAccessPageUser } from "@/lib/journal-access"
import { resolveWebLanguage, SUPPORTED_LANGUAGE_DETAILS } from "@/lib/language"

export default async function JournalPage() {
  const user = await requireJournalAccessPageUser("/journal")
  const today = getAppCalendarDate()
  const month = today.month
  const day = today.day
  const todayLabel = today.label
  const currentLanguage = await resolveWebLanguage(user.preferredLanguage)
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

  return (
    <JournalWorkspace
      thresholdPrompt={thresholdPrompt}
      todayLabel={todayLabel}
      founderCalibrationMode={founderReadiness.founderCalibrationMode}
      suggestedCalibrationScenario={founderReadiness.suggestedCalibrationScenario ?? undefined}
      needsFounderFirstSessionGuide={founderReadiness.needsFounderFirstSessionGuide}
      needsFounderFeedback={founderReadiness.needsFounderFeedback}
      founderFeedbackHref={founderReadiness.founderFeedbackHref}
      responseLanguageLabel={SUPPORTED_LANGUAGE_DETAILS[currentLanguage].nativeLabel}
      patternMemoryEnabled={user.patternMemoryEnabled ?? false}
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
