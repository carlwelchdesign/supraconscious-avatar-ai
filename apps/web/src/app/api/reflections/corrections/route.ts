import { z } from "zod"
import { recordReflectionCorrection } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const ReflectionCorrectionRequestSchema = z.object({
  reflectionSessionId: z.string().min(1),
  dimension: z.enum(["perception", "story", "fear", "ego", "genius", "supraconscious", "embodiment"]).optional(),
  correctionType: z.enum(["prefer", "suppress", "soften", "stop", "do_not_remember", "correct"]).default("suppress"),
  note: z.string().trim().max(500).optional(),
})

const RestoreCorrectionRequestSchema = z.object({ correctionId: z.string().min(1) })

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = ReflectionCorrectionRequestSchema.parse(await request.json())
    const correction = await recordReflectionCorrection({
      userId: user.id,
      reflectionSessionId: body.reflectionSessionId,
      dimension: body.dimension,
      correctionType: body.correctionType,
      note: body.note,
    })

    if (!correction) {
      return privateJson({ error: "Reflection dimension not found." }, { status: 404 })
    }

    return privateJson({
      correction: {
        id: correction.id,
        dimension: correction.dimension,
        correctionType: correction.correctionType,
      },
    })
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to save this correction." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = RestoreCorrectionRequestSchema.parse(await request.json())
    const restoredAt = new Date()
    const correction = await prisma.reflectionCorrection.updateMany({
      where: { id: body.correctionId, userId: user.id, disabledAt: null, deletedAt: null },
      data: { disabledAt: restoredAt, deletedAt: restoredAt },
    })
    if (correction.count === 0) return privateJson({ error: "Reflection correction not found." }, { status: 404 })
    return privateJson({ restored: true })
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    const apiError = readPrivateApiError(error, { fallback: "Unable to restore this reflection." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
