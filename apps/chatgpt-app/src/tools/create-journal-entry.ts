import { z } from "zod"
import { prisma } from "@inner-avatar/db"

const CreateJournalEntrySchema = z.object({
  text: z.string().trim().min(1),
  source: z.literal("chatgpt"),
  save: z.boolean().default(false)
})

export async function createJournalEntry(input: unknown, userIdOrDeps?: string | { prisma?: typeof prisma }, maybeDeps: { prisma?: typeof prisma } = {}) {
  const userId = typeof userIdOrDeps === "string" ? userIdOrDeps : undefined
  const deps = typeof userIdOrDeps === "string" ? maybeDeps : userIdOrDeps ?? {}
  const { prisma: prismaClient = prisma } = deps

  try {
    const validatedInput = CreateJournalEntrySchema.parse(input)

    if (!userId) {
      throw new Error("Authentication required to create journal entries")
    }

    const journalEntry = await prismaClient.journalEntry.create({
      data: {
        userId,
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
    if (error instanceof Error && error.message.includes("Authentication required")) {
      throw error
    }
    throw new Error(`Failed to create journal entry: ${message}`)
  }
}
