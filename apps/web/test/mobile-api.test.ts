import test from "node:test"
import assert from "node:assert/strict"
import { OPTIONAL_PILOT_CONSENTS, PILOT_CONSENT_VERSION, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import {
  buildMobileDashboardResponse,
  buildMobileGuideResponse,
  buildMobileJournalPromptResponse,
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
  assert.equal(response.language.current, "en")
  assert.deepEqual(response.language.supported.map((language) => language.code), ["en", "es", "el", "fr", "de", "zh-Hans"])
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
    preferredLanguage: "es",
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
  const ready = buildMobileSessionResponse({ user, consentRecords })
  assert.equal(ready.status, "ready")
  assert.equal(ready.user?.preferredLanguage, "es")
  assert.equal(ready.language.current, "es")
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

test("mobile saved session response includes reflection fields and selected source summaries", () => {
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
      avatarResponse: {
        openingLine: "Start here.",
        mirror: "You already know.",
        patternName: "Avoided clarity",
        contradiction: "You say yes while wanting no.",
        socraticQuestion: "What is the honest no?",
        integrationStep: "Pause once.",
        closingLine: "Stay close to the truth.",
      },
    },
    messages: [{
      id: "message-1",
      role: "protector",
      displayName: "The Protector",
      lens: "safety",
      content: "Slow down.",
      confidence: 0.8,
      abstained: false,
    }],
    synthesis: {
      integratorQuestion: "What is true?",
      integrationStep: "Pause once.",
    },
    feedback: [],
    embodimentGateResponses: [],
    generationTraces: [{
      id: "trace-1",
      sourceChunkId: "chunk-1",
      validationStatus: "selected",
      outputJson: {
        title: "Approved source",
        rank: 1,
        displayExcerpt: "Short source summary.",
        matchedTerms: ["clarity", "choice"],
      },
      sourceChunk: {
        sourceDocument: { title: "Fallback source" },
      },
    }, {
      id: "trace-2",
      sourceChunkId: "chunk-2",
      validationStatus: "rejected",
      outputJson: { title: "Rejected source" },
      sourceChunk: {
        sourceDocument: { title: "Rejected fallback" },
      },
    }],
  })

  assert.equal(response.session.avatarResponse?.mirror, "You already know.")
  assert.equal(response.session.messages[0].displayName, "The Protector")
  assert.equal(response.session.sourceGrounding.mode, "rag")
  assert.deepEqual(response.session.sourceGrounding.selectedSources, [{
    id: "chunk-1",
    title: "Approved source",
    rank: 1,
    displayExcerpt: "Short source summary.",
    matchedTerms: ["clarity", "choice"],
  }])
  assert.equal(JSON.stringify(response).includes("Rejected source"), false)
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

test("mobile guide response marks current, completed, and locked stages", () => {
  const response = buildMobileGuideResponse({
    user: {
      avatarTone: "balanced",
      intensityLevel: 3,
      avatarStage: 2,
    },
    stages: [
      { stage: 1, name: "Echo", description: "Reflects.", trait: "Listening", currentLabel: "Current", completedLabel: "Complete" },
      { stage: 2, name: "Witness", description: "Notices.", trait: "Noticing", currentLabel: "Current", completedLabel: "Complete" },
      { stage: 3, name: "Mirror", description: "Clarifies.", trait: "Clarity", currentLabel: "Current", completedLabel: "Complete" },
    ],
  })

  assert.equal(response.guide.currentStage, 2)
  assert.deepEqual(response.guide.stages.map((stage) => stage.state), ["complete", "current", "locked"])
})

test("mobile journal prompt response serializes threshold prompt", () => {
  const response = buildMobileJournalPromptResponse({
    todayLabel: "Friday, July 10",
    prompt: {
      month: 7,
      day: 10,
      theme: "Clarity",
      quote: "A short approved quote.",
      frameOfThought: "Notice what is present before solving it.",
      socraticQuestion: "What are you not letting yourself say?",
    },
  })

  assert.deepEqual(response, {
    todayLabel: "Friday, July 10",
    prompt: {
      month: 7,
      day: 10,
      theme: "Clarity",
      quote: "A short approved quote.",
      frameOfThought: "Notice what is present before solving it.",
      socraticQuestion: "What are you not letting yourself say?",
      translationKey: null,
    },
  })
})

test("mobile journal prompt response marks known translated threshold prompts", () => {
  const response = buildMobileJournalPromptResponse({
    todayLabel: "Saturday, July 11",
    prompt: {
      month: 7,
      day: 11,
      theme: "PURPOSE",
      quote: "The soul whispers before destiny speaks.",
      frameOfThought: "Purpose rarely arrives as a command. It often begins as a quiet invitation.",
      socraticQuestion: "What invitation have you been ignoring?",
    },
  })

  assert.equal(response.prompt?.translationKey, "purpose")
})

test("mobile journal prompt response marks gift responsibility threshold prompt", () => {
  const response = buildMobileJournalPromptResponse({
    todayLabel: "Sunday, July 12",
    prompt: {
      month: 7,
      day: 12,
      theme: "PURPOSE",
      quote: "Every gift carries responsibility.",
      frameOfThought: "Awareness of a gift invites its expression.",
      socraticQuestion: "What gift are you not fully using?",
    },
  })

  assert.equal(response.prompt?.translationKey, "purposeGiftResponsibility")
})

test("mobile journal prompt response does not translate unknown prompts by theme alone", () => {
  const response = buildMobileJournalPromptResponse({
    todayLabel: "Monday, July 13",
    prompt: {
      month: 7,
      day: 13,
      theme: "PURPOSE",
      quote: "An untranslated purpose quote.",
      frameOfThought: "An untranslated purpose frame.",
      socraticQuestion: "An untranslated purpose question?",
    },
  })

  assert.equal(response.prompt?.translationKey, null)
})

test("mobile journal prompt response allows no prompt", () => {
  assert.deepEqual(buildMobileJournalPromptResponse({
    todayLabel: "Friday, July 10",
    prompt: null,
  }), {
    todayLabel: "Friday, July 10",
    prompt: null,
  })
})
