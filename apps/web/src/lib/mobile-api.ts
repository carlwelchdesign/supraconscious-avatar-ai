import { OPTIONAL_PILOT_CONSENTS, PILOT_CONSENT_VERSION, REQUIRED_PILOT_CONSENTS, hasRequiredPilotConsents } from "@inner-avatar/auth/consent"
import { SUPPORTED_LANGUAGE_DETAILS, SUPPORTED_LANGUAGES, resolveSupportedLanguage } from "@inner-avatar/types/language"
import { ONBOARDING_CONSENT_ITEMS } from "./onboarding-consent-copy"

type MobileUser = {
  id: string
  email: string
  name: string | null
  onboardingComplete: boolean
  patternMemoryEnabled: boolean
  avatarTone: string
  intensityLevel: number
  currentLevel: number
  avatarStage: number
  preferredLanguage?: string | null
}

type ConsentRecord = {
  consentType: string
  consentVersion: string
  granted: boolean
  createdAt?: Date | string
}

export type MobileSessionUserInput = MobileUser | null | undefined

export function buildMobileSessionResponse(input: {
  user: MobileSessionUserInput
  consentRecords?: ConsentRecord[]
}) {
  if (!input.user) {
    return {
      authenticated: false,
      status: "unauthenticated" as const,
      user: null,
      language: buildMobileLanguageState(null),
      consent: buildMobileConsentState(input.consentRecords ?? []),
    }
  }

  const consent = buildMobileConsentState(input.consentRecords ?? [])
  const ready = input.user.onboardingComplete && consent.hasRequiredConsents

  return {
    authenticated: true,
    status: ready ? ("ready" as const) : ("onboarding_required" as const),
    user: buildMobileUser(input.user),
    language: buildMobileLanguageState(input.user.preferredLanguage),
    consent,
  }
}

export function buildMobileMfaRequiredResponse() {
  return {
    authenticated: false,
    status: "mfa_required" as const,
    user: null,
    language: buildMobileLanguageState(null),
    consent: buildMobileConsentState([]),
    mfa: {
      methods: ["passkey", "recovery_code"],
    },
  }
}

export function buildMobileUser(user: MobileUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    onboardingComplete: user.onboardingComplete,
    patternMemoryEnabled: user.patternMemoryEnabled,
    avatarTone: user.avatarTone,
    intensityLevel: user.intensityLevel,
    currentLevel: user.currentLevel,
    avatarStage: user.avatarStage,
    preferredLanguage: resolveSupportedLanguage(user.preferredLanguage),
  }
}

export function buildMobileLanguageState(preferredLanguage: string | null | undefined) {
  const current = resolveSupportedLanguage(preferredLanguage)
  return {
    current,
    default: "en" as const,
    supported: SUPPORTED_LANGUAGES.map((code) => SUPPORTED_LANGUAGE_DETAILS[code]),
  }
}

export function buildMobileConsentState(records: ConsentRecord[]) {
  return {
    version: PILOT_CONSENT_VERSION,
    hasRequiredConsents: hasRequiredPilotConsents(records),
    required: [...REQUIRED_PILOT_CONSENTS],
    optional: [...OPTIONAL_PILOT_CONSENTS],
    items: ONBOARDING_CONSENT_ITEMS.map(([type, label, required]) => ({
      type,
      label,
      required,
      granted: readLatestConsentGrant(records, type),
    })),
  }
}

export function buildMobileSavedSessionResponse(session: {
  id: string
  status: string
  sourceMode: string
  createdAt: Date | string
  journalEntry: {
    id: string
    rawText: string
    inputMode: string
    createdAt: Date | string
    avatarResponse?: {
      openingLine?: string | null
      mirror?: string | null
      patternName?: string | null
      contradiction?: string | null
      socraticQuestion?: string | null
      integrationStep?: string | null
      closingLine?: string | null
    } | null
  }
  messages: Array<{
    id: string
    role: string
    displayName: string
    lens: string
    content: string
    confidence: number
    abstained: boolean
  }>
  synthesis: {
    openingLine?: string | null
    coreTension?: string | null
    integratorQuestion: string
    integrationStep: string
    closingLine?: string | null
  } | null
  feedback: Array<{
    id: string
    feedbackType: string
    note?: string | null
    createdAt: Date | string
  }>
  embodimentGateResponses: Array<{
    id: string
    text: string
    createdAt: Date | string
  }>
  generationTraces?: Array<{
    id: string
    sourceChunkId?: string | null
    validationStatus: string
    outputJson: unknown
    sourceChunk?: {
      sourceDocument: {
        title: string
      }
    } | null
  }>
}) {
  const selectedSources = (session.generationTraces ?? [])
    .filter((trace) => trace.validationStatus === "selected")
    .map((trace) => buildMobileSourceSummary(trace))

  return {
    session: {
      id: session.id,
      status: session.status,
      sourceMode: session.sourceMode,
      createdAt: serializeDate(session.createdAt),
      journalEntry: {
        id: session.journalEntry.id,
        text: session.journalEntry.rawText,
        inputMode: session.journalEntry.inputMode,
        createdAt: serializeDate(session.journalEntry.createdAt),
      },
      avatarResponse: session.journalEntry.avatarResponse
        ? {
            openingLine: session.journalEntry.avatarResponse.openingLine ?? null,
            mirror: session.journalEntry.avatarResponse.mirror ?? null,
            patternName: session.journalEntry.avatarResponse.patternName ?? null,
            contradiction: session.journalEntry.avatarResponse.contradiction ?? null,
            socraticQuestion: session.journalEntry.avatarResponse.socraticQuestion ?? null,
            integrationStep: session.journalEntry.avatarResponse.integrationStep ?? null,
            closingLine: session.journalEntry.avatarResponse.closingLine ?? null,
          }
        : null,
      messages: session.messages.map((message) => ({
        id: message.id,
        role: message.role,
        displayName: message.displayName,
        lens: message.lens,
        content: message.content,
        confidence: message.confidence,
        abstained: message.abstained,
      })),
      synthesis: session.synthesis
        ? {
            openingLine: session.synthesis.openingLine ?? null,
            coreTension: session.synthesis.coreTension ?? null,
            integratorQuestion: session.synthesis.integratorQuestion,
            integrationStep: session.synthesis.integrationStep,
            closingLine: session.synthesis.closingLine ?? null,
          }
        : null,
      feedback: session.feedback.map((item) => ({
        id: item.id,
        feedbackType: item.feedbackType,
        hasNote: Boolean(item.note),
        createdAt: serializeDate(item.createdAt),
      })),
      embodimentGateResponses: session.embodimentGateResponses.map((response) => ({
        id: response.id,
        text: response.text,
        createdAt: serializeDate(response.createdAt),
      })),
      sourceGrounding: {
        mode: session.sourceMode,
        message: buildMobileSourceGroundingMessage(session.sourceMode),
        selectedSources,
      },
    },
  }
}

export function buildMobileDashboardResponse(input: {
  user: {
    name: string | null
    currentLevel: number
    avatarStage: number
    patternMemoryEnabled: boolean
  }
  entryCount: number
  activePatternCount: number
  recentSessions: Array<MobileSavedSessionSummaryInput>
}) {
  return {
    dashboard: {
      greetingName: input.user.name,
      currentLevel: input.user.currentLevel,
      avatarStage: input.user.avatarStage,
      patternMemoryEnabled: input.user.patternMemoryEnabled,
      entryCount: input.entryCount,
      activePatternCount: input.activePatternCount,
      recentSessions: input.recentSessions.map(buildMobileSavedSessionSummary),
    },
  }
}

type MobileSavedSessionSummaryInput = {
  id: string
  status: string
  sourceMode: string
  createdAt: Date | string
  journalEntry: {
    id: string
    rawText: string
    inputMode: string
    createdAt: Date | string
  }
  synthesis: {
    integratorQuestion: string
    integrationStep: string
  } | null
  feedback?: Array<{ id: string; feedbackType: string }>
  embodimentGateResponses?: Array<{ id: string }>
}

export function buildMobileSavedSessionsResponse(sessions: MobileSavedSessionSummaryInput[]) {
  return {
    sessions: sessions.map(buildMobileSavedSessionSummary),
  }
}

export function buildMobileSavedSessionSummary(session: MobileSavedSessionSummaryInput) {
  return {
    id: session.id,
    status: session.status,
    sourceMode: session.sourceMode,
    createdAt: serializeDate(session.createdAt),
    journalEntry: {
      id: session.journalEntry.id,
      excerpt: truncateForMobile(session.journalEntry.rawText, 180),
      inputMode: session.journalEntry.inputMode,
      createdAt: serializeDate(session.journalEntry.createdAt),
    },
    synthesis: session.synthesis
      ? {
          integratorQuestion: session.synthesis.integratorQuestion,
          integrationStep: session.synthesis.integrationStep,
        }
      : null,
    hasFeedback: (session.feedback?.length ?? 0) > 0,
    hasEmbodiment: (session.embodimentGateResponses?.length ?? 0) > 0,
  }
}

export function buildMobilePatternsResponse(patterns: Array<{
  id: string
  patternLabel: string
  evidenceCount: number
  confidence: number
  examples: unknown
  lastSeenAt: Date | string
  active: boolean
}>) {
  return {
    patterns: patterns.map((pattern) => ({
      id: pattern.id,
      patternLabel: pattern.patternLabel,
      evidenceCount: pattern.evidenceCount,
      confidence: pattern.confidence,
      examples: Array.isArray(pattern.examples)
        ? pattern.examples.map((example) => String(example)).slice(0, 3)
        : [],
      lastSeenAt: serializeDate(pattern.lastSeenAt),
      active: pattern.active,
    })),
  }
}

export function buildMobileGuideResponse(input: {
  user: {
    avatarTone: string
    intensityLevel: number
    avatarStage: number
  }
  stages: Array<{
    stage: number
    name: string
    description: string
    trait: string
    currentLabel: string
    completedLabel: string
  }>
}) {
  const currentStage = Math.min(Math.max(input.user.avatarStage ?? 1, 1), 5)
  return {
    guide: {
      currentStage,
      avatarTone: input.user.avatarTone,
      intensityLevel: input.user.intensityLevel,
      stages: input.stages.map((stage) => ({
        stage: stage.stage,
        name: stage.name,
        description: stage.description,
        trait: stage.trait,
        currentLabel: stage.currentLabel,
        completedLabel: stage.completedLabel,
        state: stage.stage < currentStage ? "complete" : stage.stage === currentStage ? "current" : "locked",
      })),
    },
  }
}

export function buildMobileJournalPromptResponse(input: {
  todayLabel: string
  prompt: {
    month: number
    day: number
    theme: string
    quote: string | null
    frameOfThought: string
    socraticQuestion: string
  } | null
  translationKey?: "purpose" | "purposeGiftResponsibility" | null
}) {
  return {
    todayLabel: input.todayLabel,
    prompt: input.prompt
      ? {
          month: input.prompt.month,
          day: input.prompt.day,
          theme: input.prompt.theme,
          quote: input.prompt.quote,
          frameOfThought: input.prompt.frameOfThought,
          socraticQuestion: input.prompt.socraticQuestion,
          translationKey: input.translationKey ?? readThresholdPromptTranslationKey(input.prompt),
        }
      : null,
  }
}

type MobileThresholdPromptForTranslation = {
  theme: string
  quote: string | null
  frameOfThought: string
  socraticQuestion: string
}

function readThresholdPromptTranslationKey(prompt: MobileThresholdPromptForTranslation): "purpose" | "purposeGiftResponsibility" | null {
  const quote = prompt.quote?.trim().toLowerCase()
  const frame = prompt.frameOfThought.trim().toLowerCase()
  const question = prompt.socraticQuestion.trim().toLowerCase()

  if (
    quote === "every gift carries responsibility." ||
    frame === "awareness of a gift invites its expression." ||
    question === "what gift are you not fully using?"
  ) {
    return "purposeGiftResponsibility"
  }

  if (
    quote === "the soul whispers before destiny speaks." ||
    frame === "purpose rarely arrives as a command. it often begins as a quiet invitation." ||
    question === "what invitation have you been ignoring?"
  ) {
    return "purpose"
  }

  return null
}

function readLatestConsentGrant(records: ConsentRecord[], type: string) {
  const latest = records.find((record) => record.consentType === type)
  return latest?.granted ?? false
}

function serializeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function truncateForMobile(value: string, maxLength: number) {
  const normalized = value.replace(/\s+/g, " ").trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`
}

function buildMobileSourceSummary(trace: {
  id: string
  sourceChunkId?: string | null
  outputJson: unknown
  sourceChunk?: {
    sourceDocument: {
      title: string
    }
  } | null
}) {
  const output = trace.outputJson && typeof trace.outputJson === "object" && !Array.isArray(trace.outputJson)
    ? trace.outputJson as { title?: unknown; rank?: unknown; displayExcerpt?: unknown; matchedTerms?: unknown }
    : {}

  return {
    id: trace.sourceChunkId ?? trace.id,
    title: typeof output.title === "string"
      ? output.title
      : trace.sourceChunk?.sourceDocument.title ?? "Approved source",
    rank: typeof output.rank === "number" ? output.rank : 0,
    displayExcerpt: typeof output.displayExcerpt === "string" ? output.displayExcerpt : null,
    matchedTerms: Array.isArray(output.matchedTerms)
      ? output.matchedTerms.map((term) => String(term)).slice(0, 6)
      : [],
  }
}

function buildMobileSourceGroundingMessage(sourceMode: string) {
  if (sourceMode === "rag") {
    return "This reflection used approved source grounding where eligible."
  }
  if (sourceMode === "curriculum") {
    return "This reflection used the approved daily curriculum frame."
  }
  return "This reflection did not use external source grounding."
}
