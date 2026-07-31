import { z } from "zod"
import {
  buildCrisisGroundingContent,
  generateSymbolicPrompt,
  classifyJournalSafety,
  analyzeEntry,
  shouldShortCircuitReflection,
} from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const GeneratePersonalizedPromptSchema = z.object({
  entryId: z.string().optional(),
  text: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
  targetPattern: z.string().optional()
}).refine(data => data.entryId || data.text, {
  message: "Either entryId or text must be provided"
})

export async function generatePersonalizedPrompt(input: unknown, userIdOrDeps: string | {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  analyzeEntry?: typeof analyzeEntry,
  generateSymbolicPrompt?: typeof generateSymbolicPrompt
} = {}, maybeDeps: {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  analyzeEntry?: typeof analyzeEntry,
  generateSymbolicPrompt?: typeof generateSymbolicPrompt
} = {}) {
  const userId = typeof userIdOrDeps === "string" ? userIdOrDeps : undefined
  const deps = typeof userIdOrDeps === "string" ? maybeDeps : userIdOrDeps
  const {
    prisma: prismaClient = prisma,
    classifyJournalSafety: classifyFn = classifyJournalSafety,
    analyzeEntry: analyzeFn = analyzeEntry,
    generateSymbolicPrompt: promptFn = generateSymbolicPrompt
  } = deps

  try {
    const validatedInput = GeneratePersonalizedPromptSchema.parse(input)

    let text: string
    if (validatedInput.entryId) {
      if (!userId) {
        throw new Error("Authentication required to read saved journal entries")
      }
      const entry = await prismaClient.journalEntry.findFirst({
        where: { id: validatedInput.entryId, userId }
      })
      if (!entry) {
        throw new Error("Journal entry not found")
      }
      text = entry.rawText
    } else {
      text = validatedInput.text!
    }

    const safety = await classifyFn(text)

    if (shouldShortCircuitReflection(safety)) {
      const grounding = buildCrisisGroundingContent(safety)
      return {
        title: grounding.openingLine,
        context: grounding.userMessage,
        materialsAndPreparation: grounding.immediateAction,
        execution: grounding.connectionAction,
        integration: grounding.closingLine,
      }
    }

    const analysis = await analyzeFn(text, safety)

    const prompt = await promptFn(analysis, safety)

    return {
      title: prompt.title,
      context: prompt.context,
      materialsAndPreparation: prompt.materialsAndPreparation,
      execution: prompt.execution,
      integration: prompt.integration
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    if (error instanceof Error && error.message.includes("Authentication required")) {
      throw error
    }
    throw new Error("Failed to generate personalized prompt")
  }
}
