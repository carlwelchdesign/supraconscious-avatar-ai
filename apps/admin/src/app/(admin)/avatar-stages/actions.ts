"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const AvatarStageSchema = z.object({
  stage: z.coerce.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().optional(),
})

export async function upsertAvatarStageAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = AvatarStageSchema.parse(Object.fromEntries(formData))

  const stage = await prisma.avatarStageConfig.upsert({
    where: { stage: parsed.stage },
    create: parsed,
    update: {
      name: parsed.name,
      description: parsed.description,
      active: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "avatar_stage_config.upsert",
      targetType: "AvatarStageConfig",
      targetId: stage.id,
      metadata: { stage: stage.stage },
    },
  })

  revalidatePath("/avatar-stages")
}
