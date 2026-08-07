import { JournalAnalyzeRequestSchema, runActiveReflection } from "@inner-avatar/ai"
import { buildJournalAnalyzeResponse } from "@/lib/journal-analyze-response"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = JournalAnalyzeRequestSchema.parse(await request.json())
    const result = await runActiveReflection({
      id: user.id,
      avatarTone: user.avatarTone,
      intensityLevel: user.intensityLevel,
      currentLevel: user.currentLevel,
      avatarStage: user.avatarStage,
      patternMemoryEnabled: user.patternMemoryEnabled,
      preferredLanguage: user.preferredLanguage,
    }, {
      text: body.text,
      inputMode: body.inputMode,
      handlingPreference: body.handlingPreference,
      calibrationScenario: body.calibrationScenario,
      requestId: request.headers.get("x-request-id") ?? undefined,
    })

    return privateJson(buildJournalAnalyzeResponse(result))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to analyze journal entry." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
