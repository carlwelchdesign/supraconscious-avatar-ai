"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { requireJournalAccessUser } from "@/lib/journal-access"

const PatternFeedbackSchema = z.object({
  patternMemoryId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_accurate", "too_intense", "suppress", "restore"]),
})

export async function submitPatternFeedbackAction(formData: FormData) {
  const user = await requireJournalAccessUser()
  const parsed = PatternFeedbackSchema.parse(Object.fromEntries(formData))

  const pattern = await prisma.patternMemory.findFirst({
    where: {
      id: parsed.patternMemoryId,
      userId: user.id,
    },
    select: { id: true },
  })

  if (!pattern) {
    throw new Error("Pattern not found.")
  }

  await prisma.patternMemoryFeedback.create({
    data: {
      userId: user.id,
      patternMemoryId: parsed.patternMemoryId,
      feedbackType: parsed.feedbackType,
    },
  })

  if (parsed.feedbackType === "suppress") {
    await prisma.patternMemory.update({
      where: { id: parsed.patternMemoryId },
      data: { active: false },
    })
  }

  if (parsed.feedbackType === "restore") {
    await prisma.patternMemory.update({
      where: { id: parsed.patternMemoryId },
      data: { active: true },
    })
  }

  revalidatePath("/patterns")
  redirect(`/patterns?feedback=${parsed.feedbackType}`)
}
