"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const AvatarStageSchema = z.object({
  stage: z.coerce.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A guide stage change reason is required."),
})

export async function upsertAvatarStageAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = AvatarStageSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/guide-stages?status=invalid")
  }

  const stage = await prisma.avatarStageConfig.upsert({
    where: { stage: parsed.data.stage },
    create: {
      stage: parsed.data.stage,
      name: parsed.data.name,
      description: parsed.data.description,
    },
    update: {
      name: parsed.data.name,
      description: parsed.data.description,
      active: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "avatar_stage_config.upsert",
      targetType: "AvatarStageConfig",
      targetId: stage.id,
      reason: parsed.data.reason,
      metadata: { stage: stage.stage },
    },
  })

  revalidatePath("/guide-stages")
  revalidatePath("/avatar-stages")
  redirect("/guide-stages?status=saved")
}
