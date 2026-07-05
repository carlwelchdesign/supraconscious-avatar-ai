import { z } from "zod"
import { generateAvatarResponse, classifyJournalSafety } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const GenerateAvatarReflectionSchema = z.object({
  entryId: z.string().optional(),
  text: z.string().optional(),
  tone: z.enum(["gentle", "balanced", "direct"]).default("balanced")
}).refine(data => data.entryId || data.text, {
  message: "Either entryId or text must be provided"
})

export async function generateAvatarReflection(input: unknown, userIdOrDeps: string | {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  generateAvatarResponse?: typeof generateAvatarResponse
} = {}, maybeDeps: {
  prisma?: typeof prisma,
  classifyJournalSafety?: typeof classifyJournalSafety,
  generateAvatarResponse?: typeof generateAvatarResponse
} = {}) {
  const userId = typeof userIdOrDeps === "string" ? userIdOrDeps : undefined
  const deps = typeof userIdOrDeps === "string" ? maybeDeps : userIdOrDeps
  const {
    prisma: prismaClient = prisma,
    classifyJournalSafety: classifyFn = classifyJournalSafety,
    generateAvatarResponse: generateFn = generateAvatarResponse
  } = deps

  try {
    const validatedInput = GenerateAvatarReflectionSchema.parse(input)

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

    if (safety.severity === "high") {
      return {
        pilotScope: "Legacy analysis-only tool during the internal pilot. Use the web app for the Inner Council pilot flow.",
        openingLine: "Pause here.",
        mirror: "This entry contains content that needs immediate attention. Please reach out to a trusted friend, family member, or professional for support.",
        patternName: "Grounding",
        socraticQuestion: "Can you name one place of support available to you right now?",
        integrationStep: "Take a moment to breathe and remember you're not alone in this.",
        closingLine: "Do not solve everything in this moment."
      }
    }

    const avatar = await generateFn(text, {
      emotionalSignals: { primary: [], secondary: [], intensity: 5 },
      languageMarkers: {
        repeatedWords: [],
        absolutes: [],
        passiveVoiceExamples: [],
        ownershipLanguageExamples: []
      },
      behavioralPatterns: [],
      contradictionSignals: [],
      avoidanceSignals: [],
      suggestedLevel: 3,
      safetyFlags: { severity: safety.severity, flags: safety.flags },
      summary: ""
    }, safety, {
      tone: validatedInput.tone,
      intensity: 5,
      currentLevel: 3,
      avatarStage: 3
    })

    return {
      pilotScope: "Legacy analysis-only tool during the internal pilot. Use the web app for the Inner Council pilot flow.",
      openingLine: avatar.openingLine,
      mirror: avatar.mirror,
      patternName: avatar.patternName,
      contradiction: avatar.contradiction,
      socraticQuestion: avatar.socraticQuestion,
      integrationStep: avatar.integrationStep,
      closingLine: avatar.closingLine
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    if (error instanceof Error && error.message.includes("Authentication required")) {
      throw error
    }
    throw new Error("Failed to generate avatar reflection")
  }
}
