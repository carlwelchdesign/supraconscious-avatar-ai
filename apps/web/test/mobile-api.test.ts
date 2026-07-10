import test from "node:test"
import assert from "node:assert/strict"
import { OPTIONAL_PILOT_CONSENTS, PILOT_CONSENT_VERSION, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import {
  buildMobileDashboardResponse,
  buildMobilePatternsResponse,
  buildMobileSavedSessionResponse,
  buildMobileSavedSessionsResponse,
  buildMobileSessionResponse,
} from "../src/lib/mobile-api"

test("mobile session response reports unauthenticated state", () => {
  const response = buildMobileSessionResponse({ user: null })

  assert.equal(response.authenticated, false)
  assert.equal(response.status, "unauthenticated")
  assert.equal(response.user, null)
  assert.equal(response.consent.version, PILOT_CONSENT_VERSION)
  assert.deepEqual(response.consent.required, [...REQUIRED_PILOT_CONSENTS])
  assert.deepEqual(response.consent.optional, [...OPTIONAL_PILOT_CONSENTS])
  assert.equal(response.consent.hasRequiredConsents, false)
  assert.deepEqual(
    response.consent.items.map((item) => ({ type: item.type, required: item.required, granted: item.granted })),
    [
      { type: "privacy_terms", required: true, granted: false },
      { type: "ai_processing", required: true, granted: false },
      { type: "pattern_memory", required: false, granted: false },
      { type: "pilot_participation", required: true, granted: false },
      { type: "safety_limits", required: true, granted: false },
    ],
  )
})

test("mobile session response distinguishes onboarding from ready", () => {
  const user = {
    id: "user-1",
    email: "a@example.com",
    name: "A",
    onboardingComplete: true,
    patternMemoryEnabled: true,
    avatarTone: "balanced",
    intensityLevel: 3,
    currentLevel: 1,
    avatarStage: 1,
  }
  const consentRecords = [
    ...REQUIRED_PILOT_CONSENTS.map((consentType) => ({
      consentType,
      consentVersion: PILOT_CONSENT_VERSION,
      granted: true,
    })),
    ...OPTIONAL_PILOT_CONSENTS.map((consentType) => ({
      consentType,
      consentVersion: PILOT_CONSENT_VERSION,
      granted: true,
    })),
  ]

  assert.equal(buildMobileSessionResponse({ user: { ...user, onboardingComplete: false }, consentRecords }).status, "onboarding_required")
  assert.equal(buildMobileSessionResponse({ user, consentRecords }).status, "ready")
})

test("mobile saved session response omits private feedback notes", () => {
  const response = buildMobileSavedSessionResponse({
    id: "session-1",
    status: "completed",
    sourceMode: "rag",
    createdAt: new Date("2026-07-10T12:00:00.000Z"),
    journalEntry: {
      id: "entry-1",
      rawText: "My full journal text",
      inputMode: "text",
      createdAt: new Date("2026-07-10T11:59:00.000Z"),
    },
    messages: [],
    synthesis: {
      integratorQuestion: "What is true?",
      integrationStep: "Pause once.",
    },
    feedback: [{
      id: "feedback-1",
      feedbackType: "helpful",
      note: "private note",
      createdAt: new Date("2026-07-10T12:01:00.000Z"),
    }],
    embodimentGateResponses: [],
  })

  assert.equal(response.session.journalEntry.text, "My full journal text")
  assert.deepEqual(response.session.feedback, [{
    id: "feedback-1",
    feedbackType: "helpful",
    hasNote: true,
    createdAt: "2026-07-10T12:01:00.000Z",
  }])
  assert.equal(JSON.stringify(response).includes("private note"), false)
})

test("mobile dashboard response includes counts and recent session summaries", () => {
  const response = buildMobileDashboardResponse({
    user: {
      name: "Carl",
      currentLevel: 2,
      avatarStage: 3,
      patternMemoryEnabled: true,
    },
    entryCount: 12,
    activePatternCount: 4,
    recentSessions: [{
      id: "session-1",
      status: "completed",
      sourceMode: "none",
      createdAt: new Date("2026-07-10T12:00:00.000Z"),
      journalEntry: {
        id: "entry-1",
        rawText: "This is a long journal entry that should become a mobile-safe excerpt.",
        inputMode: "text",
        createdAt: new Date("2026-07-10T11:59:00.000Z"),
      },
      synthesis: {
        integratorQuestion: "What is true?",
        integrationStep: "Pause once.",
      },
      feedback: [{ id: "feedback-1", feedbackType: "helpful" }],
      embodimentGateResponses: [],
    }],
  })

  assert.equal(response.dashboard.greetingName, "Carl")
  assert.equal(response.dashboard.entryCount, 12)
  assert.equal(response.dashboard.activePatternCount, 4)
  assert.equal(response.dashboard.recentSessions[0].id, "session-1")
  assert.equal(response.dashboard.recentSessions[0].hasFeedback, true)
})

test("mobile saved sessions response uses excerpts instead of raw full text", () => {
  const response = buildMobileSavedSessionsResponse([{
    id: "session-1",
    status: "completed",
    sourceMode: "none",
    createdAt: "2026-07-10T12:00:00.000Z",
    journalEntry: {
      id: "entry-1",
      rawText: `${"x".repeat(240)} private ending`,
      inputMode: "text",
      createdAt: "2026-07-10T11:59:00.000Z",
    },
    synthesis: null,
  }])

  assert.equal(response.sessions.length, 1)
  assert.equal(response.sessions[0].journalEntry.excerpt.length <= 180, true)
  assert.equal(response.sessions[0].journalEntry.excerpt.includes("private ending"), false)
})

test("mobile patterns response serializes examples and visibility", () => {
  const response = buildMobilePatternsResponse([{
    id: "pattern-1",
    patternLabel: "Over-responsibility",
    evidenceCount: 3,
    confidence: 0.78,
    examples: ["first", "second", "third", "fourth"],
    lastSeenAt: new Date("2026-07-10T12:00:00.000Z"),
    active: false,
  }])

  assert.deepEqual(response.patterns, [{
    id: "pattern-1",
    patternLabel: "Over-responsibility",
    evidenceCount: 3,
    confidence: 0.78,
    examples: ["first", "second", "third"],
    lastSeenAt: "2026-07-10T12:00:00.000Z",
    active: false,
  }])
})
