import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { buildPatternsResponse } from "@/lib/patterns-response"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

export async function GET() {
  try {
    const user = await requireJournalAccessUser()
    const [patterns, recentEntries] = await Promise.all([
      prisma.patternMemory.findMany({
        where: { userId: user.id, active: true },
        orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
        take: 12,
      }),
      prisma.journalEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          analysis: true,
          avatarResponse: true,
          generatedPrompts: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ])

    return privateJson(buildPatternsResponse({ patterns, recentEntries }))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to load patterns." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
