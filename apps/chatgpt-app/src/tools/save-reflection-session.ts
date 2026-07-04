import { z } from "zod"
import { prisma } from "@inner-avatar/db"

const SaveReflectionSessionSchema = z.object({
  entryText: z.string().trim().min(1),
  analysis: z.object({
    safetyStatus: z.string(),
    emotionalSignals: z.array(z.string()),
    languagePatterns: z.array(z.string()),
    behavioralPatterns: z.array(z.object({
      label: z.string(),
      evidenceCount: z.number(),
      confidence: z.number()
    })),
    contradictions: z.array(z.object({
      statedDesire: z.string(),
      conflictingBehavior: z.string()
    })),
    suggestedLevel: z.number(),
    summary: z.string()
  }),
  avatarResponse: z.object({
    openingLine: z.string().optional(),
    mirror: z.string().optional(),
    patternName: z.string().optional(),
    contradiction: z.string().optional(),
    socraticQuestion: z.string().optional(),
    integrationStep: z.string().optional(),
    closingLine: z.string().optional()
  }),
  generatedPrompt: z.object({
    title: z.string(),
    context: z.string(),
    materialsAndPreparation: z.string(),
    execution: z.string(),
    integration: z.string()
  })
})

export async function saveReflectionSession(input: unknown, userId?: string, deps: { prisma?: typeof prisma } = {}) {
  const { prisma: prismaClient = prisma } = deps

  try {
    // This tool requires authentication
    if (!userId) {
      throw new Error("Authentication required to save reflection session")
    }

    const validatedInput = SaveReflectionSessionSchema.parse(input)

    // Create journal entry
    const journalEntry = await prismaClient.journalEntry.create({
      data: {
        userId,
        rawText: validatedInput.entryText,
        inputMode: "text",
        isDraft: false
      }
    })

    // Save analysis
    await prismaClient.entryAnalysis.create({
      data: {
        userId,
        journalEntryId: journalEntry.id,
        emotionalSignals: {
          primary: validatedInput.analysis.emotionalSignals,
          secondary: [],
          intensity: 5
        },
        languageMarkers: {
          repeatedWords: validatedInput.analysis.languagePatterns,
          absolutes: [],
          passiveVoiceExamples: [],
          ownershipLanguageExamples: []
        },
        behavioralPatterns: validatedInput.analysis.behavioralPatterns.map(p => ({
          label: p.label,
          confidence: p.confidence,
          evidence: []
        })),
        contradictionSignals: validatedInput.analysis.contradictions.map(c => ({
          statedDesire: c.statedDesire,
          conflictingBehavior: c.conflictingBehavior,
          confidence: 0.8
        })),
        avoidanceSignals: [],
        suggestedLevel: validatedInput.analysis.suggestedLevel,
        safetyFlags: {
          severity: validatedInput.analysis.safetyStatus === "crisis" ? "high" :
                   validatedInput.analysis.safetyStatus === "needs_grounding" ? "medium" : "none",
          flags: []
        },
        summary: validatedInput.analysis.summary
      }
    })

    // Save avatar response
    await prismaClient.avatarResponse.create({
      data: {
        userId,
        journalEntryId: journalEntry.id,
        openingLine: validatedInput.avatarResponse.openingLine || "",
        mirror: validatedInput.avatarResponse.mirror || "",
        patternName: validatedInput.avatarResponse.patternName || "",
        contradiction: validatedInput.avatarResponse.contradiction || "",
        socraticQuestion: validatedInput.avatarResponse.socraticQuestion || "",
        integrationStep: validatedInput.avatarResponse.integrationStep || "",
        closingLine: validatedInput.avatarResponse.closingLine || ""
      }
    })

    // Save generated prompt
    await prismaClient.generatedPrompt.create({
      data: {
        userId,
        journalEntryId: journalEntry.id,
        level: 3, // Default level
        title: validatedInput.generatedPrompt.title,
        context: validatedInput.generatedPrompt.context,
        materials: validatedInput.generatedPrompt.materialsAndPreparation,
        execution: validatedInput.generatedPrompt.execution,
        integration: validatedInput.generatedPrompt.integration,
        targetPattern: "reflection"
      }
    })

    return {
      sessionId: journalEntry.id,
      saved: true
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      throw error
    }
    throw new Error("Failed to save reflection session")
  }
}
