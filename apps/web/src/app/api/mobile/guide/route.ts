import { getGuideStageConfigs } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { buildMobileGuideResponse } from "@/lib/mobile-api"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function GET() {
  try {
    const [user, stages] = await Promise.all([
      requireJournalAccessUser(),
      getGuideStageConfigs(prisma),
    ])

    return privateJson(buildMobileGuideResponse({ user, stages }))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load guide." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
