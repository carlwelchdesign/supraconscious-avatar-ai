import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { buildCreatedJournalEntryResponse, CREATED_JOURNAL_ENTRY_SELECT } from "@/lib/journal-entry-response"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const SaveDraftSchema = z.object({
  id: z.string().min(1).optional(),
  text: z.string().trim().min(1),
})

const DeleteDraftSchema = z.object({ id: z.string().min(1) })

export async function PUT(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = SaveDraftSchema.parse(await request.json())
    const existing = body.id
      ? await prisma.journalEntry.findFirst({ where: { id: body.id, userId: user.id, isDraft: true }, select: { id: true } })
      : null
    const journalEntry = existing
      ? await prisma.journalEntry.update({
          where: { id: existing.id },
          data: { rawText: body.text },
          select: CREATED_JOURNAL_ENTRY_SELECT,
        })
      : await prisma.journalEntry.create({
          data: { userId: user.id, rawText: body.text, inputMode: "text", isDraft: true },
          select: CREATED_JOURNAL_ENTRY_SELECT,
        })
    return privateJson(buildCreatedJournalEntryResponse(journalEntry))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    const apiError = readPrivateApiError(error, { fallback: "Unable to save journal draft." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = DeleteDraftSchema.parse(await request.json())
    await prisma.journalEntry.deleteMany({ where: { id: body.id, userId: user.id, isDraft: true } })
    return privateJson({ deleted: true })
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    const apiError = readPrivateApiError(error, { fallback: "Unable to remove journal draft." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
