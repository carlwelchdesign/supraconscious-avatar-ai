import { prisma } from "@inner-avatar/db"
import { getAppCalendarDate } from "@/lib/date-format"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { buildMobileJournalPromptResponse } from "@/lib/mobile-api"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const promptSelect = {
  month: true,
  day: true,
  theme: true,
  quote: true,
  frameOfThought: true,
  socraticQuestion: true,
} as const

export async function GET() {
  try {
    await requireJournalAccessUser()
    const today = getAppCalendarDate()
    const monthPrompts = await prisma.curriculumDay.findMany({
      where: {
        publishState: "approved_curriculum",
        month: today.month,
      },
      orderBy: { day: "asc" },
      select: promptSelect,
    })
    const todaysPrompt = monthPrompts.find((prompt) => prompt.day === today.day) ?? null
    const fallbackPrompt = todaysPrompt ? null : (monthPrompts[0] ?? null)

    return privateJson(buildMobileJournalPromptResponse({
      todayLabel: today.label,
      prompt: todaysPrompt ?? fallbackPrompt,
    }))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load journal prompt." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
