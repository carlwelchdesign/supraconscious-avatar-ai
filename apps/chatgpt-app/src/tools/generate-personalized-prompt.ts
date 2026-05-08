import { z } from "zod"
import { generateSymbolicPrompt, classifyJournalSafety, analyzeEntry } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const GeneratePersonalizedPromptSchema = z.object({
  entryId: z.string().optional(),
  text: z.string().optional(),
  level: z.number().int().min(1).max(5).optional(),
  targetPattern: z.string().optional()
}).refine(data => data.entryId || data.text, {
  message: "Either entryId or text must be provided"
})

export async function generatePersonalizedPrompt(input: any, deps: {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  analyzeEntry?: typeof analyzeEntry,
  generateSymbolicPrompt?: typeof generateSymbolicPrompt
} = {}) {
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
      // Fetch text from database
      const entry = await prismaClient.journalEntry.findUnique({
        where: { id: validatedInput.entryId }
      })
      if (!entry) {
        throw new Error("Journal entry not found")
      }
      text = entry.rawText
    } else {
      text = validatedInput.text!
    }

    // Run safety classification
    const safety = await classifyFn(text)

    // If crisis, return grounding prompt only
    if (safety.severity === "high") {
      return {
        title: "Return to the Room",
        context: "When the entry feels urgent or unsafe, the first reflection is orientation.",
        materialsAndPreparation: "A visible object, a steady surface, and one sentence.",
        execution: "Look around and name five things you can see. Place one hand on a surface and write where you are.",
        integration: "What is one next step that keeps you connected to real support?"
      }
    }

    // Analyze the entry to get patterns
    const analysis = await analyzeFn(text, safety)

    // Generate symbolic prompt
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
    throw new Error("Failed to generate personalized prompt")
  }
}