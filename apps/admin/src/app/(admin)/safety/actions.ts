"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { requireAdminUser } from "@inner-avatar/auth/session"

const RevealSchema = z.object({
  safetyEventId: z.string().min(1),
  reason: z.string().trim().min(10, "A support/moderation reason is required."),
})

const ResolveSchema = z.object({
  safetyEventId: z.string().min(1),
  reviewStatus: z.enum(["resolved", "escalated"]),
  reason: z.string().trim().min(10, "A safety review reason is required."),
})

export type RevealState = {
  error?: string
  rawText?: string
}

export async function revealFlaggedEntryAction(_state: RevealState, formData: FormData): Promise<RevealState> {
  const actor = await requireAdminUser()
  const parsed = RevealSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Unable to reveal entry." }
  }

  const safetyEvent = await prisma.safetyEvent.findUnique({
    where: { id: parsed.data.safetyEventId },
    include: { journalEntry: { select: { id: true, rawText: true } } },
  })

  if (!safetyEvent?.journalEntry) {
    return { error: "No journal entry is attached to this safety event." }
  }

  const requestHeaders = await headers()
  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "journal_entry.reveal",
      targetType: "JournalEntry",
      targetId: safetyEvent.journalEntry.id,
      reason: parsed.data.reason,
      metadata: { safetyEventId: safetyEvent.id, severity: safetyEvent.severity },
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim(),
      userAgent: requestHeaders.get("user-agent"),
    },
  })

  return { rawText: safetyEvent.journalEntry.rawText }
}

export async function resolveSafetyEventAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ResolveSchema.parse(Object.fromEntries(formData))
  const resolved = parsed.reviewStatus === "resolved"

  await prisma.safetyEvent.update({
    where: { id: parsed.safetyEventId },
    data: {
      reviewStatus: parsed.reviewStatus,
      reviewerId: actor.id,
      reviewReason: parsed.reason,
      resolved,
      resolvedAt: resolved ? new Date() : null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "safety_event.review.update",
      targetType: "SafetyEvent",
      targetId: parsed.safetyEventId,
      reason: parsed.reason,
      metadata: { reviewStatus: parsed.reviewStatus, resolved },
    },
  })

  revalidatePath("/safety")
}
