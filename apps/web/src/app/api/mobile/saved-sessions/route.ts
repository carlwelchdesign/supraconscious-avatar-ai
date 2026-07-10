import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { buildMobileSavedSessionsResponse } from "@/lib/mobile-api"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function GET() {
  try {
    const user = await requireJournalAccessUser()
    const sessions = await prisma.councilSession.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 25,
      select: {
        id: true,
        status: true,
        sourceMode: true,
        createdAt: true,
        journalEntry: {
          select: {
            id: true,
            rawText: true,
            inputMode: true,
            createdAt: true,
          },
        },
        synthesis: {
          select: {
            integratorQuestion: true,
            integrationStep: true,
          },
        },
        feedback: { select: { id: true, feedbackType: true } },
        embodimentGateResponses: { select: { id: true } },
      },
    })

    return privateJson(buildMobileSavedSessionsResponse(sessions))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load saved sessions." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
