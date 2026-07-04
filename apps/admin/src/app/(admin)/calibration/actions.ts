"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const CalibrationReviewSchema = z.object({
  councilSessionId: z.string().min(1),
  label: z.enum(["voice_good", "voice_wrong", "source_good", "source_unsupported", "too_generic", "too_intense", "embodiment_weak", "ready"]),
  calibrationIssueType: z.enum(["none", "voice_mismatch", "source_issue", "prompt_issue", "product_copy_issue", "embodiment_weak"]).default("none"),
  severity: z.enum(["normal", "pilot_blocker"]).default("normal"),
  reason: z.string().trim().min(10, "A calibration review reason is required."),
})

export async function reviewCalibrationSessionAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CalibrationReviewSchema.parse(Object.fromEntries(formData))
  const session = await prisma.councilSession.findUnique({
    where: { id: parsed.councilSessionId },
    select: { id: true },
  })
  if (!session) throw new Error("Council session not found.")

  const review = await prisma.qualityReview.create({
    data: {
      reviewerId: actor.id,
      councilSessionId: session.id,
      targetType: "FounderCalibration",
      label: parsed.label,
      severity: parsed.severity,
      reason: parsed.reason,
      metadata: {
        reviewedFrom: "admin_calibration",
        calibrationIssueType: parsed.calibrationIssueType === "none" ? null : parsed.calibrationIssueType,
        goldenExample: parsed.label === "ready",
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "founder_calibration.review.create",
      targetType: "CouncilSession",
      targetId: session.id,
      reason: parsed.reason,
      metadata: {
        qualityReviewId: review.id,
        label: parsed.label,
        severity: parsed.severity,
        calibrationIssueType: parsed.calibrationIssueType,
      },
    },
  })

  revalidatePath("/calibration")
  revalidatePath("/pilot")
  revalidatePath("/council")
}
