import { z } from "zod"
import { analyzeEntry, classifyJournalSafety } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const AnalyzeJournalEntrySchema = z.object({
  entryId: z.string().optional(),
  text: z.string().optional()
}).refine(data => data.entryId || data.text, {
  message: "Either entryId or text must be provided"
})

export async function analyzeJournalEntry(input: unknown, userIdOrDeps: string | {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  analyzeEntry?: typeof analyzeEntry
} = {}, maybeDeps: {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  analyzeEntry?: typeof analyzeEntry
} = {}) {
  const userId = typeof userIdOrDeps === "string" ? userIdOrDeps : undefined
  const deps = typeof userIdOrDeps === "string" ? maybeDeps : userIdOrDeps
  const {
    prisma: prismaClient = prisma,
    classifyJournalSafety: classifyFn = classifyJournalSafety,
    analyzeEntry: analyzeFn = analyzeEntry
  } = deps

  try {
    const validatedInput = AnalyzeJournalEntrySchema.parse(input)

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
    if (error instanceof Error && error.message.includes("Authentication required")) {
      throw error
    }
    throw new Error("Failed to analyze journal entry")
  }
}
