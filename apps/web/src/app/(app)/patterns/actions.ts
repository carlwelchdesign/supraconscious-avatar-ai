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
  const parsed = PatternFeedbackSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    redirect("/patterns?feedback=invalid")
  }

  const pattern = await prisma.patternMemory.findFirst({
    where: {
      id: parsed.data.patternMemoryId,
      userId: user.id,
    },
    select: { id: true },
  })

  if (!pattern) {
    redirect("/patterns?feedback=missing")
  }

  await prisma.patternMemoryFeedback.create({
    data: {
      userId: user.id,
      patternMemoryId: parsed.data.patternMemoryId,
      feedbackType: parsed.data.feedbackType,
    },
  })

  if (parsed.data.feedbackType === "suppress") {
    await prisma.patternMemory.update({
      where: { id: parsed.data.patternMemoryId },
      data: { active: false },
    })
  }

  if (parsed.data.feedbackType === "restore") {
    await prisma.patternMemory.update({
      where: { id: parsed.data.patternMemoryId },
      data: { active: true },
    })
  }

  revalidatePath("/patterns")
  redirect(`/patterns?feedback=${parsed.data.feedbackType}`)
}
