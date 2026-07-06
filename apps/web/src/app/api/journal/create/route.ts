import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { buildCreatedJournalEntryResponse, CREATED_JOURNAL_ENTRY_SELECT } from "@/lib/journal-entry-response"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const CreateJournalEntrySchema = z.object({
  text: z.string().trim().min(1),
  inputMode: z.enum(["text", "voice"]).default("text"),
  isDraft: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = CreateJournalEntrySchema.parse(await request.json())

    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        rawText: body.text,
        inputMode: body.inputMode,
        isDraft: body.isDraft,
      },
      select: CREATED_JOURNAL_ENTRY_SELECT,
    })

    return privateJson(buildCreatedJournalEntryResponse(journalEntry))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to create journal entry." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
