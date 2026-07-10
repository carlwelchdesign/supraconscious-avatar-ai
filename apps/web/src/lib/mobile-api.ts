import { OPTIONAL_PILOT_CONSENTS, PILOT_CONSENT_VERSION, REQUIRED_PILOT_CONSENTS, hasRequiredPilotConsents } from "@inner-avatar/auth/consent"
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
      consent: buildMobileConsentState(input.consentRecords ?? []),
    }
  }

  const consent = buildMobileConsentState(input.consentRecords ?? [])
  const ready = input.user.onboardingComplete && consent.hasRequiredConsents

  return {
    authenticated: true,
    status: ready ? ("ready" as const) : ("onboarding_required" as const),
    user: buildMobileUser(input.user),
    consent,
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
}) {
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
    },
  }
}

function readLatestConsentGrant(records: ConsentRecord[], type: string) {
  const latest = records.find((record) => record.consentType === type)
  return latest?.granted ?? false
}

function serializeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}
