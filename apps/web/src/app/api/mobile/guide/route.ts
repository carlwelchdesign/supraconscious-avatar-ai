import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { buildMobileGuideResponse } from "@/lib/mobile-api"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function GET() {
  try {
    const user = await requireJournalAccessUser()
    return privateJson(buildMobileGuideResponse({ user }))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load guide." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
