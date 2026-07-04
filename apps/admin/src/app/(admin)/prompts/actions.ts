"use server"

import { revalidatePath } from "next/cache"
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
  const parsed = PromptTemplateSchema.parse(Object.fromEntries(formData))
  const relatedCalibrationSessionIds = parseRelatedSessionIds(parsed.relatedCalibrationSessionIds)

  if (isCouncilPromptTemplateKey(parsed.key)) {
    const guardrails = validateCouncilPromptTemplate(parsed.content)
    if (!guardrails.valid) {
      throw new Error(`Council prompt is missing required guardrails: ${guardrails.missing.join(", ")}`)
    }
  }

  const existing = await prisma.promptTemplate.findUnique({
    where: { key: parsed.key },
    select: { id: true, version: true },
  })

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
      reason: parsed.reason,
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
}

function parseRelatedSessionIds(value: string | undefined) {
  return (value ?? "")
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
}
