import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_SYSTEM_PROMPT } from "./avatar-system-prompt.js"
import { COUNCIL_ROLES } from "./council-roles.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import { languageInstruction, localAiCopy, type ResponseLanguage } from "./response-language.js"
import {
  type CouncilRetrievedContext,
} from "./source-context.js"
import {
  CouncilRunSchema,
  type CouncilMessage,
  type CouncilRun,
  type CouncilSynthesis,
  type EntryAnalysis,
  type ObserverSignal,
  type SafetyCheck,
} from "./schemas.js"

export type CouncilOptions = {
  tone: string
  intensity: number
  currentLevel: number
  avatarStage: number
  promptTemplate?: {
    key: string
    version: number
    content: string
  }
  sourceContext?: Array<{
    id: string
    title: string
    text: string
    sourceDocumentId?: string
    rank?: number
    matchReason?: string
    allowedUse?: string
    quotePermission?: string
    sourcePolicyVersion?: string
    displayExcerpt?: string | null
  }>
  language?: ResponseLanguage
}

export const DEFAULT_COUNCIL_PROMPT_KEY = "council.system"
export const DEFAULT_COUNCIL_PROMPT_VERSION = 1
export const DEFAULT_COUNCIL_SYSTEM_PROMPT = `${AVATAR_SYSTEM_PROMPT}

You are orchestrating the Inner Council, a bounded spiritual reflection ritual inspired by Maria Olon Tsaroucha's teachings.
You are not Maria. You do not speak for Maria. You do not channel. You are not a therapist, doctor, guru, oracle, or authority.
You reveal reflective possibilities from the user's language.

Council rules:
- Use exactly these four council roles: ${COUNCIL_ROLES.map((role) => role.displayName).join(", ")}.
- Each council role must return no more than two short sentences.
- Every council role must stay inside its lens.
- The Supraconscious Guide synthesizes with exactly one integrator question.
- Do not diagnose, prescribe treatment, predict fate, claim certainty, say "Maria says", or use channeling language.
- If source context is insufficient, do not invent doctrine.
- If safety is medium, soften Shadow/Truth-style confrontation and favor grounding.

Return only the structured CouncilRun object.`

export async function generateCouncilRun(
  text: string,
  analysis: EntryAnalysis,
  safety: SafetyCheck,
  options: CouncilOptions,
): Promise<CouncilRun> {
  const language = options.language ?? "en"
  if (!safety.allowReflectiveFlow || safety.severity === "high") {
    return buildGroundingCouncilRun(text, safety, language)
  }

  if (!isOpenAIConfigured()) {
    return buildLocalCouncilRun(text, analysis, language)
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${options.promptTemplate?.content ?? DEFAULT_COUNCIL_SYSTEM_PROMPT}

${languageInstruction(language)}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          journalEntry: text,
          analysis,
          safety,
          preferences: options,
          language,
          councilRoles: COUNCIL_ROLES,
          sourceContext: options.sourceContext ?? [],
        }),
      },
    ],
    text: {
      format: zodTextFormat(CouncilRunSchema, "council_run"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Council generator returned no structured output.")
  }

  return validateCouncilSourceCitations(
    enforceCouncilShape(response.output_parsed, analysis, language),
    options.sourceContext ?? [],
  )
}

export function buildLocalCouncilRun(text: string, analysis: EntryAnalysis, language: ResponseLanguage = "en"): CouncilRun {
  const copy = localAiCopy(language).council
  const observer = buildObserver(text, analysis, language)
  const primaryPattern = analysis.behavioralPatterns[0]?.label ?? localAiCopy(language).patternFallback
  const evidence = analysis.behavioralPatterns[0]?.evidence?.slice(0, 2) ?? [text.slice(0, 180)]

  const messages: CouncilMessage[] = [
    {
      role: "protector",
      displayName: "Protector",
      lens: "Safety, fear, risk, and emotional protection",
      content: copy.protector,
      evidence,
      confidence: 0.68,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
    {
      role: "conditioned_self",
      displayName: "Conditioned Self",
      lens: "Inherited scripts, roles, habits, and learned behavior",
      content: copy.conditionedSelf(primaryPattern),
      evidence,
      confidence: 0.66,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
    {
      role: "visionary",
      displayName: "Visionary",
      lens: "Future potential, expansion, values, and emergence",
      content: copy.visionary,
      evidence,
      confidence: 0.62,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
    {
      role: "truth_self",
      displayName: "Truth Self",
      lens: "Direct clarity, contradiction, and self-honesty",
      content: observer.contradiction || copy.truthSelfFallback,
      evidence: observer.userEvidence,
      confidence: 0.64,
      riskLevel: "low",
      abstained: false,
      abstainReason: "",
      sourceChunkIds: [],
    },
  ]

  return {
    observer,
    messages,
    synthesis: buildSynthesis(observer, language),
  }
}

export function buildGroundingCouncilRun(text: string, safety: SafetyCheck, language: ResponseLanguage = "en"): CouncilRun {
  const copy = localAiCopy(language).council
  const observer: ObserverSignal = {
    coreTension: copy.safetyCoreTension,
    emotionalTone: safety.severity,
    patternLanguage: safety.flags,
    contradiction: copy.safetyContradiction,
    userEvidence: [text.slice(0, 180)],
  }

  return {
    observer,
    messages: COUNCIL_ROLES.map((role) => ({
      role: role.role,
      displayName: role.displayName,
      lens: role.lens,
      content: copy.safetyQuiet,
      evidence: [],
      confidence: 1,
      riskLevel: "high",
      abstained: true,
      abstainReason: copy.safetyAbstainReason,
      sourceChunkIds: [],
    })),
    synthesis: {
      guideName: copy.guideName,
      openingLine: copy.pauseHere,
      coreTension: observer.coreTension,
      integratorQuestion: copy.supportQuestion,
      integrationStep: copy.groundingStep,
      closingLine: copy.groundingClose,
      sourceChunkIds: [],
    },
  }
}

function buildObserver(text: string, analysis: EntryAnalysis, language: ResponseLanguage): ObserverSignal {
  const copy = localAiCopy(language).council
  const contradiction = analysis.contradictionSignals[0]
  return {
    coreTension: analysis.summary,
    emotionalTone: analysis.emotionalSignals.primary[0] ?? "unclear",
    patternLanguage: analysis.behavioralPatterns.map((pattern) => pattern.label).slice(0, 3),
    contradiction: contradiction
      ? copy.contradiction(contradiction.statedDesire, contradiction.conflictingBehavior)
      : copy.contradictionFallback,
    userEvidence: [text.slice(0, 180)],
  }
}

function buildSynthesis(observer: ObserverSignal, language: ResponseLanguage): CouncilSynthesis {
  const copy = localAiCopy(language).council
  return {
    guideName: copy.guideName,
    openingLine: copy.openingLine,
    coreTension: observer.coreTension,
    integratorQuestion: copy.integratorQuestion,
    integrationStep: copy.integrationStep,
    closingLine: copy.closingLine,
    sourceChunkIds: [],
  }
}

export function enforceCouncilShape(run: CouncilRun, analysis: EntryAnalysis, language: ResponseLanguage = "en"): CouncilRun {
  const fallback = buildLocalCouncilRun("", analysis, language)
  const messages = COUNCIL_ROLES.map((role) => {
    const message = run.messages.find((item) => item.role === role.role)
    return {
      ...(message ?? fallback.messages.find((item) => item.role === role.role)!),
      displayName: role.displayName,
      lens: role.lens,
      content: limitSentences(message?.content ?? "", 2) || fallback.messages.find((item) => item.role === role.role)!.content,
    }
  })

  return {
    observer: run.observer,
    messages,
    synthesis: {
      ...run.synthesis,
      integratorQuestion: ensureSingleQuestion(run.synthesis.integratorQuestion),
    },
  }
}

export function validateCouncilSourceCitations(
  run: CouncilRun,
  sourceContext: Array<Pick<CouncilRetrievedContext, "id"> | { id: string }>,
): CouncilRun {
  const allowedIds = sourceContext.map((chunk) => chunk.id)
  const allowed = new Set(allowedIds)
  if (allowed.size === 0) {
    return clearCouncilSourceIds(run)
  }
  const filteredMessageIds = run.messages.map((message) => message.sourceChunkIds.filter((id) => allowed.has(id)))
  const filteredSynthesisIds = run.synthesis.sourceChunkIds.filter((id) => allowed.has(id))
  const hasAnyValidCitation = filteredMessageIds.some((ids) => ids.length > 0) || filteredSynthesisIds.length > 0
  const repairedSynthesisIds = hasAnyValidCitation ? filteredSynthesisIds : allowedIds.slice(0, 1)

  return {
    ...run,
    messages: run.messages.map((message, index) => ({
      ...message,
      content: stripUnsupportedSourceLanguage(message.content),
      sourceChunkIds: filteredMessageIds[index] ?? [],
    })),
    synthesis: {
      ...run.synthesis,
      openingLine: run.synthesis.openingLine ? stripUnsupportedSourceLanguage(run.synthesis.openingLine) : run.synthesis.openingLine,
      coreTension: run.synthesis.coreTension ? stripUnsupportedSourceLanguage(run.synthesis.coreTension) : run.synthesis.coreTension,
      integrationStep: stripUnsupportedSourceLanguage(run.synthesis.integrationStep),
      closingLine: run.synthesis.closingLine ? stripUnsupportedSourceLanguage(run.synthesis.closingLine) : run.synthesis.closingLine,
      sourceChunkIds: repairedSynthesisIds,
    },
  }
}

function clearCouncilSourceIds(run: CouncilRun): CouncilRun {
  return {
    ...run,
    messages: run.messages.map((message) => ({
      ...message,
      content: stripUnsupportedSourceLanguage(message.content),
      sourceChunkIds: [],
    })),
    synthesis: {
      ...run.synthesis,
      openingLine: run.synthesis.openingLine ? stripUnsupportedSourceLanguage(run.synthesis.openingLine) : run.synthesis.openingLine,
      coreTension: run.synthesis.coreTension ? stripUnsupportedSourceLanguage(run.synthesis.coreTension) : run.synthesis.coreTension,
      integrationStep: stripUnsupportedSourceLanguage(run.synthesis.integrationStep),
      closingLine: run.synthesis.closingLine ? stripUnsupportedSourceLanguage(run.synthesis.closingLine) : run.synthesis.closingLine,
      sourceChunkIds: [],
    },
  }
}

function limitSentences(value: string, max: number) {
  return value
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean)
    .slice(0, max)
    .join(" ")
    .trim()
}

function ensureSingleQuestion(value: string) {
  const first = value.split("?")[0]?.trim()
  if (!first) return "What becomes clear now?"
  return `${first}?`
}

function stripUnsupportedSourceLanguage(value: string) {
  return value
    .replace(/\bMaria says\b/gi, "One possible reflection is")
    .replace(/\baccording to Maria\b/gi, "within this reflective frame")
    .replace(/\bthe source says\b/gi, "one approved source context suggests")
    .replace(/\baccording to the source\b/gi, "within the approved source context")
    .trim()
}
