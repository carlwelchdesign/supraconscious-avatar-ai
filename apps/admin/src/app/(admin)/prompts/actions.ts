"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const PromptTemplateSchema = z.object({
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9._-]+$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().optional(),
  content: z.string().trim().min(10),
})

export async function createPromptTemplateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = PromptTemplateSchema.parse(Object.fromEntries(formData))

  const template = await prisma.promptTemplate.upsert({
    where: { key: parsed.key },
    create: {
      key: parsed.key,
      name: parsed.name,
      description: parsed.description,
      content: parsed.content,
      createdById: actor.id,
    },
    update: {
      name: parsed.name,
      description: parsed.description,
      content: parsed.content,
      version: { increment: 1 },
      active: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "prompt_template.upsert",
      targetType: "PromptTemplate",
      targetId: template.id,
      metadata: { key: template.key, version: template.version },
    },
  })

  revalidatePath("/prompts")
}
