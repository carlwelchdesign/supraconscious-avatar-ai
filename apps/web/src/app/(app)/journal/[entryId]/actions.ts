"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { emitPilotEvent, isFounderCalibrationFeedbackNoteUseful, isFounderCalibrationUser } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { requireJournalAccessUser } from "@/lib/journal-access"

const FeedbackSchema = z.object({
  councilSessionId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_accurate", "too_intense", "unclear", "unsupported_source"]),
  note: z.string().trim().max(500).optional(),
})

export async function submitSavedSessionFeedbackAction(formData: FormData) {
  const user = await requireJournalAccessUser()
  const parsed = FeedbackSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    redirect("/dashboard?feedback=invalid")
  }

  const session = await prisma.councilSession.findFirst({
    where: { id: parsed.data.councilSessionId, userId: user.id },
    select: { id: true, journalEntryId: true, sourceMode: true, safetySnapshot: true },
  })
  if (!session) redirect("/dashboard?feedback=session_missing")

  const founderCalibrationMode = await isFounderCalibrationUser(user.email)
  if (founderCalibrationMode && !isFounderCalibrationFeedbackNoteUseful(parsed.data.note)) {
    redirect(`/journal/${session.journalEntryId}?feedback=note_required`)
  }

  await prisma.councilSessionFeedback.create({
    data: {
      userId: user.id,
      councilSessionId: session.id,
      feedbackType: parsed.data.feedbackType,
      note: parsed.data.note || null,
    },
  })
  const safety = session.safetySnapshot as { severity?: string }
  await emitPilotEvent({
    eventName: "user_feedback_submitted",
    userId: user.id,
    journalEntryId: session.journalEntryId,
    councilSessionId: session.id,
    sourceMode: session.sourceMode,
    safetySeverity: safety.severity ?? "unknown",
    properties: { feedbackType: parsed.data.feedbackType, savedEntry: true, hasNote: Boolean(parsed.data.note) },
  })

  revalidatePath(`/journal/${session.journalEntryId}`)
  revalidatePath("/dashboard")
  redirect(`/journal/${session.journalEntryId}?feedback=saved`)
}

export async function deleteJournalEntryAction(formData: FormData) {
  const user = await requireJournalAccessUser()
  const entryId = String(formData.get("journalEntryId") ?? "")
  if (!entryId) redirect("/dashboard?delete=invalid")
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    select: { id: true, rawText: true },
  })
  if (!entry) redirect("/dashboard?delete=missing")
  const inputHash = await hashForAudit(entry.rawText)

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "journal_entry.delete",
        targetType: "JournalEntry",
        targetId: entry.id,
        reason: "User deleted journal entry.",
        metadata: { inputHash },
      },
    }),
    prisma.journalEntry.delete({ where: { id: entry.id } }),
  ])
  await emitPilotEvent({
    eventName: "journal_entry_deleted",
    userId: user.id,
    inputHash,
    properties: { deletedByUser: true },
  })

  redirect("/dashboard")
}

async function hashForAudit(value: string) {
  const { createHash } = await import("node:crypto")
  return createHash("sha256").update(value).digest("hex")
}
