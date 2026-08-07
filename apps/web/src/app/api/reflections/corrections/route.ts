import { z } from "zod"
import { recordReflectionCorrection } from "@inner-avatar/ai"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const ReflectionCorrectionRequestSchema = z.object({
  reflectionSessionId: z.string().min(1),
  dimension: z.enum(["perception", "story", "fear", "ego", "genius", "supraconscious", "embodiment"]),
})

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = ReflectionCorrectionRequestSchema.parse(await request.json())
    const correction = await recordReflectionCorrection({
      userId: user.id,
      reflectionSessionId: body.reflectionSessionId,
      dimension: body.dimension,
      correctionType: "suppress",
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
