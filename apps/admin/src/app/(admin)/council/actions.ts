"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const CouncilQualitySchema = z.object({
  councilSessionId: z.string().min(1),
  validationStatus: z.enum(["unreviewed", "grounded", "too_vague", "too_intense", "unsupported", "safety_concern"]),
})

export async function updateCouncilQualityLabelAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CouncilQualitySchema.parse(Object.fromEntries(formData))

  const result = await prisma.generationTrace.updateMany({
    where: {
      councilSessionId: parsed.councilSessionId,
      traceType: { in: ["council", "synthesis"] },
    },
    data: {
      validationStatus: parsed.validationStatus,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "council_session.quality_label.update",
      targetType: "CouncilSession",
      targetId: parsed.councilSessionId,
      metadata: {
        validationStatus: parsed.validationStatus,
        updatedTraceCount: result.count,
      },
    },
  })

  revalidatePath("/council")
}
