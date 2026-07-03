"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { emitPilotEvent } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const FeedbackSchema = z.object({
  councilSessionId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_accurate", "too_intense", "unclear", "unsupported_source"]),
})

export async function submitSavedSessionFeedbackAction(formData: FormData) {
  const user = await requireAppUser()
  const parsed = FeedbackSchema.parse(Object.fromEntries(formData))
  const session = await prisma.councilSession.findFirst({
    where: { id: parsed.councilSessionId, userId: user.id },
    select: { id: true, journalEntryId: true, sourceMode: true, safetySnapshot: true },
  })
  if (!session) throw new Error("Council session not found.")

  await prisma.councilSessionFeedback.create({
    data: {
      userId: user.id,
      councilSessionId: session.id,
      feedbackType: parsed.feedbackType,
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
    properties: { feedbackType: parsed.feedbackType, savedEntry: true },
  })

  revalidatePath(`/journal/${session.journalEntryId}`)
}

export async function deleteJournalEntryAction(formData: FormData) {
  const user = await requireAppUser()
  const entryId = String(formData.get("journalEntryId") ?? "")
  if (!entryId) throw new Error("Journal entry is required.")
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    select: { id: true, rawText: true },
  })
  if (!entry) throw new Error("Journal entry not found.")

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "journal_entry.delete",
        targetType: "JournalEntry",
        targetId: entry.id,
        reason: "User deleted journal entry.",
        metadata: { inputHash: await hashForAudit(entry.rawText) },
      },
    }),
    prisma.journalEntry.delete({ where: { id: entry.id } }),
  ])
  await emitPilotEvent({
    eventName: "journal_entry_deleted",
    userId: user.id,
    inputText: entry.rawText,
    properties: { deletedByUser: true },
  })

  redirect("/dashboard")
}

async function hashForAudit(value: string) {
  const { createHash } = await import("node:crypto")
  return createHash("sha256").update(value).digest("hex")
}
