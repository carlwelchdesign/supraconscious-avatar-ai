import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { buildMobilePatternsResponse } from "@/lib/mobile-api"
import { buildPatternMemoryVisibilityUpdate } from "@/lib/pattern-memory-feedback"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const PatternFeedbackSchema = z.object({
  patternMemoryId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_accurate", "too_intense", "suppress", "restore"]),
})

export async function GET() {
  try {
    const user = await requireJournalAccessUser()
    const patterns = await prisma.patternMemory.findMany({
      where: { userId: user.id },
      orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
      select: {
        id: true,
        patternLabel: true,
        evidenceCount: true,
        confidence: true,
        examples: true,
        lastSeenAt: true,
        active: true,
      },
    })

    return privateJson(buildMobilePatternsResponse(patterns))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load patterns." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = PatternFeedbackSchema.parse(await request.json())
    const pattern = await prisma.patternMemory.findFirst({
      where: {
        id: body.patternMemoryId,
        userId: user.id,
      },
      select: { id: true },
    })

    if (!pattern) {
      return privateJson({ error: "Pattern not found." }, { status: 404 })
    }

    await prisma.patternMemoryFeedback.create({
      data: {
        userId: user.id,
        patternMemoryId: body.patternMemoryId,
        feedbackType: body.feedbackType,
      },
    })

    const visibilityUpdate = buildPatternMemoryVisibilityUpdate({
      feedbackType: body.feedbackType,
      patternMemoryId: body.patternMemoryId,
      userId: user.id,
    })

    if (visibilityUpdate) {
      await prisma.patternMemory.updateMany(visibilityUpdate)
    }

    return privateJson({ ok: true, feedbackType: body.feedbackType })
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to save pattern feedback." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
