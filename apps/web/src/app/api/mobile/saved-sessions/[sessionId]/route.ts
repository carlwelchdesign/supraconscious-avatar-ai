import { prisma } from "@inner-avatar/db"
import { buildMobileSavedSessionResponse } from "@/lib/mobile-api"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function GET(_request: Request, context: { params: Promise<{ sessionId: string }> }) {
  try {
    const user = await requireJournalAccessUser()
    const { sessionId } = await context.params
    const session = await prisma.councilSession.findFirst({
      where: {
        id: sessionId,
        userId: user.id,
      },
      include: {
        journalEntry: {
          select: {
            id: true,
            rawText: true,
            inputMode: true,
            createdAt: true,
            avatarResponse: {
              select: {
                openingLine: true,
                mirror: true,
                patternName: true,
                contradiction: true,
                socraticQuestion: true,
                integrationStep: true,
                closingLine: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            role: true,
            displayName: true,
            lens: true,
            content: true,
            confidence: true,
            abstained: true,
          },
        },
        synthesis: {
          select: {
            openingLine: true,
            coreTension: true,
            integratorQuestion: true,
            integrationStep: true,
            closingLine: true,
          },
        },
        feedback: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            feedbackType: true,
            note: true,
            createdAt: true,
          },
        },
        embodimentGateResponses: {
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            text: true,
            createdAt: true,
          },
        },
        generationTraces: {
          where: { traceType: "retrieval" },
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            sourceChunkId: true,
            validationStatus: true,
            outputJson: true,
            sourceChunk: {
              select: {
                sourceDocument: {
                  select: { title: true },
                },
              },
            },
          },
        },
      },
    })

    if (!session) {
      return privateJson({ error: "Saved session not found." }, { status: 404 })
    }

    return privateJson(buildMobileSavedSessionResponse(session))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load saved session." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
