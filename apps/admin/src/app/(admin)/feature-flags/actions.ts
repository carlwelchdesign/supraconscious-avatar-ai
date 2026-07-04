"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const FeatureFlagSchema = z.object({
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9._-]+$/),
  description: z.string().trim().optional(),
  enabled: z.union([z.literal("on"), z.null()]).optional(),
})

export async function upsertFeatureFlagAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = FeatureFlagSchema.parse({
    key: formData.get("key"),
    description: formData.get("description"),
    enabled: formData.get("enabled"),
  })
  const requestedEnabled = parsed.enabled === "on"

  if (parsed.key === "rag_enabled" && requestedEnabled) {
    throw new Error("RAG can only be enabled through the RAG readiness activation gate.")
  }

  const flag = await prisma.featureFlag.upsert({
    where: { key: parsed.key },
    create: {
      key: parsed.key,
      description: parsed.description,
      enabled: requestedEnabled,
    },
    update: {
      description: parsed.description,
      enabled: requestedEnabled,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "feature_flag.upsert",
      targetType: "FeatureFlag",
      targetId: flag.id,
      metadata: { key: flag.key, enabled: flag.enabled },
    },
  })

  revalidatePath("/feature-flags")
}
