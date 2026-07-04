import { z } from "zod"
import { prisma } from "@inner-avatar/db"

const CreateJournalEntrySchema = z.object({
  text: z.string().trim().min(1),
  source: z.literal("chatgpt"),
  save: z.boolean().default(false)
})

export async function createJournalEntry(input: unknown, deps: { prisma?: typeof prisma } = {}) {
  const { prisma: prismaClient = prisma } = deps

  try {
    const validatedInput = CreateJournalEntrySchema.parse(input)

    // For demo purposes, ensure we have a demo user
    let demoUser = await prismaClient.user.findUnique({
      where: { email: "demo@inner-avatar.ai" }
    })

    if (!demoUser) {
      demoUser = await prismaClient.user.create({
        data: {
          email: "demo@inner-avatar.ai",
          name: "Demo User",
          role: "user",
          emailVerified: true,
          onboardingComplete: true
        }
      })
    }

    // Create journal entry
    const journalEntry = await prismaClient.journalEntry.create({
      data: {
        userId: demoUser.id,
        rawText: validatedInput.text,
        inputMode: "text",
        isDraft: !validatedInput.save
      }
    })

    return {
      entryId: journalEntry.id,
      saved: validatedInput.save
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    throw new Error(`Failed to create journal entry: ${message}`)
  }
}
