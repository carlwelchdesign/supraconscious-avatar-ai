import { z } from "zod"

export const SafetySeveritySchema = z.enum(["none", "low", "medium", "high"])

export const SafetyCheckSchema = z.object({
  severity: SafetySeveritySchema,
  flags: z.array(z.string()),
  recommendedAction: z.string(),
  userMessage: z.string(),
  allowReflectiveFlow: z.boolean(),
})

export const EntryAnalysisSchema = z.object({
  emotionalSignals: z.object({
    primary: z.array(z.string()),
    secondary: z.array(z.string()),
    intensity: z.number().min(0).max(10),
  }),
  languageMarkers: z.object({
    repeatedWords: z.array(z.string()),
    absolutes: z.array(z.string()),
    passiveVoiceExamples: z.array(z.string()),
    ownershipLanguageExamples: z.array(z.string()),
  }),
  behavioralPatterns: z.array(
    z.object({
      label: z.string(),
      confidence: z.number().min(0).max(1),
      evidence: z.array(z.string()),
    }),
  ),
  contradictionSignals: z.array(
    z.object({
      statedDesire: z.string(),
      conflictingBehavior: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  avoidanceSignals: z.array(
    z.object({
      topic: z.string(),
      evidence: z.string(),
      confidence: z.number().min(0).max(1),
    }),
  ),
  suggestedLevel: z.number().int().min(1).max(5),
  safetyFlags: z.object({
    severity: SafetySeveritySchema,
    flags: z.array(z.string()),
  }),
  summary: z.string(),
})

export const AvatarResponseSchema = z.object({
  openingLine: z.string(),
  mirror: z.string(),
  patternName: z.string(),
  contradiction: z.string(),
  socraticQuestion: z.string(),
  integrationStep: z.string(),
  closingLine: z.string(),
})

export const GeneratedPromptSchema = z.object({
  title: z.string(),
  context: z.string(),
  materialsAndPreparation: z.string(),
  execution: z.string(),
  integration: z.string(),
  level: z.number().int().min(1).max(5),
  targetPattern: z.string(),
})

export const JournalAnalyzeRequestSchema = z.object({
  text: z.string().trim().min(20, "Write at least 20 characters before reflecting."),
  inputMode: z.enum(["text", "voice"]).default("text"),
})

export const CouncilRoleSchema = z.enum([
  "protector",
  "conditioned_self",
  "visionary",
  "truth_self",
])

export const ObserverSignalSchema = z.object({
  coreTension: z.string(),
  emotionalTone: z.string(),
  patternLanguage: z.array(z.string()),
  contradiction: z.string(),
  userEvidence: z.array(z.string()),
})

export const CouncilMessageSchema = z.object({
  role: CouncilRoleSchema,
  displayName: z.string(),
  lens: z.string(),
  content: z.string(),
  evidence: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  riskLevel: z.enum(["low", "medium", "high"]).default("low"),
  abstained: z.boolean().default(false),
  abstainReason: z.string().default(""),
  sourceChunkIds: z.array(z.string()).default([]),
})

export const CouncilSynthesisSchema = z.object({
  guideName: z.string().default("Supraconscious Guide"),
  openingLine: z.string(),
  coreTension: z.string(),
  integratorQuestion: z.string(),
  integrationStep: z.string(),
  closingLine: z.string(),
  sourceChunkIds: z.array(z.string()).default([]),
})

export const CouncilRunSchema = z.object({
  observer: ObserverSignalSchema,
  messages: z.array(CouncilMessageSchema).length(4),
  synthesis: CouncilSynthesisSchema,
})

export type SafetyCheck = z.infer<typeof SafetyCheckSchema>
export type EntryAnalysis = z.infer<typeof EntryAnalysisSchema>
export type AvatarResponse = z.infer<typeof AvatarResponseSchema>
export type GeneratedPrompt = z.infer<typeof GeneratedPromptSchema>
export type CouncilRole = z.infer<typeof CouncilRoleSchema>
export type ObserverSignal = z.infer<typeof ObserverSignalSchema>
export type CouncilMessage = z.infer<typeof CouncilMessageSchema>
export type CouncilSynthesis = z.infer<typeof CouncilSynthesisSchema>
export type CouncilRun = z.infer<typeof CouncilRunSchema>
