"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const CouncilQualitySchema = z.object({
  councilSessionId: z.string().min(1),
  validationStatus: z.enum(["unreviewed", "grounded", "too_vague", "too_intense", "unsupported", "safety_concern"]),
  disposition: z.enum(["reviewed", "blocked", "cleared"]).default("reviewed"),
  severity: z.enum(["normal", "pilot_blocker"]).default("normal"),
  reason: z.string().trim().min(10, "A quality review reason is required."),
})

const BatchCouncilQualitySchema = z.object({
  sessionIds: z.array(z.string().min(1)).min(1, "Select at least one session."),
  validationStatus: z.enum(["grounded", "too_vague", "too_intense", "unsupported", "safety_concern"]),
  disposition: z.enum(["reviewed", "blocked", "cleared"]),
  severity: z.enum(["normal", "pilot_blocker"]).default("normal"),
  reason: z.string().trim().min(10, "A batch review reason is required."),
})

export async function updateCouncilQualityLabelAction(formData: FormData) {
  return reviewPilotSessionFromCouncilAction(formData)
}

export async function reviewPilotSessionFromCouncilAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CouncilQualitySchema.parse(Object.fromEntries(formData))

  await createCouncilQualityReview({
    actorId: actor.id,
    councilSessionId: parsed.councilSessionId,
    label: parsed.validationStatus,
    disposition: parsed.disposition,
    severity: parsed.severity,
    reason: parsed.reason,
    action: "council_session.quality_label.update",
    reviewedFrom: "admin_council",
  })

  revalidatePath("/council")
  revalidatePath("/pilot")
}

export async function batchReviewPilotSessionsAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = BatchCouncilQualitySchema.parse({
    sessionIds: formData.getAll("sessionIds").map((value) => String(value)),
    validationStatus: formData.get("validationStatus"),
    disposition: formData.get("disposition"),
    severity: formData.get("severity") ?? "normal",
    reason: formData.get("reason"),
  })
  const uniqueSessionIds = Array.from(new Set(parsed.sessionIds))
  const sessions = await prisma.councilSession.findMany({
    where: { id: { in: uniqueSessionIds } },
    select: { id: true },
  })
  if (sessions.length !== uniqueSessionIds.length) {
    throw new Error("One or more council sessions were not found.")
  }

  for (const sessionId of uniqueSessionIds) {
    await createCouncilQualityReview({
      actorId: actor.id,
      councilSessionId: sessionId,
      label: parsed.validationStatus,
      disposition: parsed.disposition,
      severity: parsed.severity,
      reason: parsed.reason,
      action: "council_session.batch_quality_label.update",
      reviewedFrom: "admin_council_batch",
    })
  }

  revalidatePath("/council")
  revalidatePath("/pilot")
}

async function createCouncilQualityReview(input: {
  actorId: string
  councilSessionId: string
  label: "unreviewed" | "grounded" | "too_vague" | "too_intense" | "unsupported" | "safety_concern"
  disposition: "reviewed" | "blocked" | "cleared"
  severity: "normal" | "pilot_blocker"
  reason: string
  action: string
  reviewedFrom: string
}) {
  const review = await prisma.qualityReview.create({
    data: {
      reviewerId: input.actorId,
      councilSessionId: input.councilSessionId,
      label: input.label,
      severity: input.severity,
      reason: input.reason,
      metadata: {
        feedbackDisposition: input.disposition,
        reviewedFrom: input.reviewedFrom,
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: input.action,
      targetType: "CouncilSession",
      targetId: input.councilSessionId,
      reason: input.reason,
      metadata: {
        validationStatus: input.label,
        severity: input.severity,
        feedbackDisposition: input.disposition,
        qualityReviewId: review.id,
      },
    },
  })
}
