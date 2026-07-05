"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { isCouncilPromptTemplateKey, validateCouncilPromptTemplate } from "@inner-avatar/ai"

const PromptTemplateSchema = z.object({
  key: z.string().trim().min(2).max(80).regex(/^[a-z0-9._-]+$/),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().optional(),
  content: z.string().trim().min(10),
  reason: z.string().trim().min(10, "A prompt update reason is required."),
  relatedCalibrationSessionIds: z.string().trim().optional(),
})

export async function createPromptTemplateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = PromptTemplateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/prompts?status=invalid")
  }
  const input = parsed.data
  const relatedCalibrationSessionIds = parseRelatedSessionIds(input.relatedCalibrationSessionIds)

  if (isCouncilPromptTemplateKey(input.key)) {
    const guardrails = validateCouncilPromptTemplate(input.content)
    if (!guardrails.valid) {
      redirect("/prompts?status=guardrails_missing")
    }
  }

  const existing = await prisma.promptTemplate.findUnique({
    where: { key: input.key },
    select: { id: true, version: true },
  })

  const template = await prisma.promptTemplate.upsert({
    where: { key: input.key },
    create: {
      key: input.key,
      name: input.name,
      description: input.description,
      content: input.content,
      createdById: actor.id,
    },
    update: {
      name: input.name,
      description: input.description,
      content: input.content,
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
      reason: input.reason,
      metadata: {
        key: template.key,
        oldVersion: existing?.version ?? null,
        newVersion: template.version,
        relatedCalibrationSessionIds,
      },
    },
  })

  revalidatePath("/prompts")
  revalidatePath("/calibration")
  redirect("/prompts?status=saved")
}

function parseRelatedSessionIds(value: string | undefined) {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}
