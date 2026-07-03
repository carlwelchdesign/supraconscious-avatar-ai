"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const SourceStateSchema = z.object({
  sourceDocumentId: z.string().min(1),
  reviewState: z.enum(["imported", "parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]),
  rightsStatus: z.enum(["needs_review", "approved", "paraphrase_only", "blocked"]),
})

const CurriculumStateSchema = z.object({
  curriculumDayId: z.string().min(1),
  publishState: z.enum(["needs_review", "approved_curriculum", "deprecated", "blocked"]),
})

export async function updateSourceDocumentStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = SourceStateSchema.parse(Object.fromEntries(formData))

  await prisma.sourceDocument.update({
    where: { id: parsed.sourceDocumentId },
    data: {
      reviewState: parsed.reviewState,
      rightsStatus: parsed.rightsStatus,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_document.review_state.update",
      targetType: "SourceDocument",
      targetId: parsed.sourceDocumentId,
      metadata: {
        reviewState: parsed.reviewState,
        rightsStatus: parsed.rightsStatus,
      },
    },
  })

  revalidatePath("/sources")
}

export async function updateCurriculumDayStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CurriculumStateSchema.parse(Object.fromEntries(formData))

  await prisma.curriculumDay.update({
    where: { id: parsed.curriculumDayId },
    data: { publishState: parsed.publishState },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "curriculum_day.publish_state.update",
      targetType: "CurriculumDay",
      targetId: parsed.curriculumDayId,
      metadata: { publishState: parsed.publishState },
    },
  })

  revalidatePath("/sources")
  revalidatePath("/journal")
}
