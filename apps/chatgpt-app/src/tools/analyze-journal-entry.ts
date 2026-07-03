import { z } from "zod"
import { analyzeEntry, classifyJournalSafety } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const AnalyzeJournalEntrySchema = z.object({
  entryId: z.string().optional(),
  text: z.string().optional()
}).refine(data => data.entryId || data.text, {
  message: "Either entryId or text must be provided"
})

export async function analyzeJournalEntry(input: unknown, deps: {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  analyzeEntry?: typeof analyzeEntry
} = {}) {
  const {
    prisma: prismaClient = prisma,
    classifyJournalSafety: classifyFn = classifyJournalSafety,
    analyzeEntry: analyzeFn = analyzeEntry
  } = deps

  try {
    const validatedInput = AnalyzeJournalEntrySchema.parse(input)

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

    // Run safety classification first
    const safety = await classifyFn(text)

    // Analyze the entry
    const analysis = await analyzeFn(text, safety)

    return {
      pilotScope: "Legacy analysis-only tool during the internal pilot. Use the web app for the Inner Council pilot flow.",
      safetyStatus: safety.severity === "none" ? "clear" :
                   safety.severity === "low" ? "needs_grounding" : "crisis",
      emotionalSignals: analysis.emotionalSignals.primary,
      languagePatterns: analysis.languageMarkers.repeatedWords,
      behavioralPatterns: analysis.behavioralPatterns.map((p) => ({
        label: p.label,
        evidenceCount: p.evidence.length,
        confidence: p.confidence
      })),
      contradictions: analysis.contradictionSignals.map((c) => ({
        statedDesire: c.statedDesire,
        conflictingBehavior: c.conflictingBehavior
      })),
      suggestedLevel: analysis.suggestedLevel,
      summary: analysis.summary
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    throw new Error("Failed to analyze journal entry")
  }
}
