"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const CouncilQualitySchema = z.object({
  councilSessionId: z.string().min(1),
  validationStatus: z.enum(["unreviewed", "grounded", "too_vague", "too_intense", "unsupported", "safety_concern"]),
  severity: z.enum(["normal", "pilot_blocker"]).default("normal"),
  reason: z.string().trim().min(10, "A quality review reason is required."),
})

export async function updateCouncilQualityLabelAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CouncilQualitySchema.parse(Object.fromEntries(formData))

  const review = await prisma.qualityReview.create({
    data: {
      reviewerId: actor.id,
      councilSessionId: parsed.councilSessionId,
      label: parsed.validationStatus,
      severity: parsed.severity,
      reason: parsed.reason,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "council_session.quality_label.update",
      targetType: "CouncilSession",
      targetId: parsed.councilSessionId,
      reason: parsed.reason,
      metadata: {
        validationStatus: parsed.validationStatus,
        severity: parsed.severity,
        qualityReviewId: review.id,
      },
    },
  })

  revalidatePath("/council")
}
