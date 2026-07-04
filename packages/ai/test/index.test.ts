import assert from "node:assert/strict"
import test from "node:test"
import {
  buildApprovedSourceWhere,
  buildPilotLearningReportFromSnapshot,
  classifySourcePath,
  buildGroundingCouncilRun,
  buildLocalCouncilRun,
  evaluatePilotLaunchReadinessSnapshot,
  enforceCouncilShape,
  INNER_COUNCIL_FEATURE_FLAGS,
  parseRagActivationEvalReport,
  parseCurriculumDaysFromParagraphs,
  readRagActivationMetadata,
  runKeywordRagEvals,
  runPilotCouncilEvals,
  readDisposition,
  readFeedbackDisposition,
  sanitizeProperties,
  SOURCE_POLICY_VERSION,
  shouldWritePatternMemory,
  validateCouncilRunForPilot,
  validateCouncilSourceCitations,
  type EntryAnalysis,
  type SafetyCheck,
} from "../src/index.js"

const analysis: EntryAnalysis = {
  emotionalSignals: {
    primary: ["uncertain"],
    secondary: ["hopeful"],
    intensity: 4,
  },
  languageMarkers: {
    repeatedWords: [],
    absolutes: [],
    passiveVoiceExamples: [],
    ownershipLanguageExamples: [],
  },
  behavioralPatterns: [
    {
      label: "Overexplaining",
      confidence: 0.74,
      evidence: ["I keep explaining before I choose."],
    },
  ],
  contradictionSignals: [
    {
      statedDesire: "clarity",
      conflictingBehavior: "waiting for certainty",
      confidence: 0.7,
    },
  ],
  avoidanceSignals: [],
  suggestedLevel: 3,
  safetyFlags: {
    severity: "low",
    flags: [],
  },
  summary: "A choice wants to emerge, while old caution asks for delay.",
}

const highSafety: SafetyCheck = {
  severity: "high",
  flags: ["self_harm"],
  recommendedAction: "grounding",
  userMessage: "Pause and seek support.",
  allowReflectiveFlow: false,
}

test("high-risk entries use grounding and skip council confrontation", () => {
  const run = buildGroundingCouncilRun("I need urgent help and cannot stay with this.", highSafety)
  assert.equal(run.messages.length, 4)
  assert.equal(run.messages.every((message) => message.abstained), true)
  assert.equal(run.messages.every((message) => message.riskLevel === "high"), true)
  assert.match(run.synthesis.integratorQuestion, /\?$/)
})

test("local council roles stay concise", () => {
  const run = buildLocalCouncilRun("I keep explaining before I choose.", analysis)
  assert.equal(run.messages.length, 4)
  for (const message of run.messages) {
    const sentenceCount = message.content.split(/[.!?]+/).filter((part) => part.trim()).length
    assert.ok(sentenceCount <= 2, `${message.role} returned more than two sentences`)
  }
})

test("integrator synthesis is forced to exactly one question", () => {
  const run = buildLocalCouncilRun("I keep explaining before I choose.", analysis)
  const enforced = enforceCouncilShape({
    ...run,
    synthesis: {
      ...run.synthesis,
      integratorQuestion: "What is true? What comes next? Why now?",
    },
  }, analysis)

  assert.equal((enforced.synthesis.integratorQuestion.match(/\?/g) ?? []).length, 1)
  assert.equal(enforced.synthesis.integratorQuestion, "What is true?")
})

test("pattern memory opt-out blocks writes", () => {
  assert.equal(shouldWritePatternMemory(false), false)
  assert.equal(shouldWritePatternMemory(null), false)
  assert.equal(shouldWritePatternMemory(undefined), false)
  assert.equal(shouldWritePatternMemory(true), true)
})

test("approved source filter never retrieves unapproved chunks", () => {
  const where = buildApprovedSourceWhere("supraconscious genius pattern")
  assert.deepEqual(where.reviewState, { in: ["approved", "approved_curriculum"] })
  assert.deepEqual(where.sourceDocument.reviewState, { in: ["approved", "approved_curriculum"] })
  assert.deepEqual(where.sourceDocument.rightsStatus, { in: ["approved", "paraphrase_only"] })
  assert.equal(where.safetyIntensity.not, "blocked")
})

test("inner council feature flags seed with conservative RAG defaults", () => {
  const flags = Object.fromEntries(INNER_COUNCIL_FEATURE_FLAGS.map((flag) => [flag.key, flag.enabled]))
  assert.equal(flags.council_mode, true)
  assert.equal(flags.rag_enabled, false)
  assert.equal(flags.memory_feedback_enabled, false)
  assert.equal(flags.admin_evals_enabled, false)
})

test("monthly DOCX curriculum parser creates reviewable days", () => {
  const days = parseCurriculumDaysFromParagraphs([
    "JANUARY",
    "WHO AM I?",
    "Days 1-31",
    "Day 1",
    "Quote",
    "Know thyself.",
    "Frame of Thought",
    "Identity begins in honest observation.",
    "Socratic Question",
    "What part of me is asking to be seen today?",
    "Day 2",
    "Quote",
    "A second quote.",
    "Frame of Thought",
    "A second frame.",
    "Socratic Question",
    "What choice becomes available when I pause?",
  ])

  assert.equal(days.length, 2)
  assert.equal(days[0]?.month, 1)
  assert.equal(days[0]?.day, 1)
  assert.equal(days[0]?.theme, "WHO AM I?")
  assert.equal(days[0]?.publishState, "needs_review")
})

test("source importer classifies corpus paths conservatively", () => {
  assert.equal(classifySourcePath("YEARLY QUOTES , FRAME/JULY.docx").sourceType, "curriculum")
  assert.equal(classifySourcePath("BOOKS /SUPRACONSCIOUS.docx").sourceType, "manuscript")
  assert.equal(classifySourcePath("AVATAR IMAGES/echo.png").sourceType, "image")
  assert.equal(classifySourcePath("The Inner Council_.docx").sourceType, "product_doctrine")
})

test("citation validator removes citations outside retrieved context", () => {
  const run = buildLocalCouncilRun("I keep explaining before I choose.", analysis)
  const withSourceIds = {
    ...run,
    messages: run.messages.map((message) => ({
      ...message,
      sourceChunkIds: ["allowed", "blocked"],
    })),
    synthesis: {
      ...run.synthesis,
      sourceChunkIds: ["allowed", "unknown"],
    },
  }
  const validated = validateCouncilSourceCitations(withSourceIds, [{ id: "allowed" }])
  assert.deepEqual(validated.messages[0]?.sourceChunkIds, ["allowed"])
  assert.deepEqual(validated.synthesis.sourceChunkIds, ["allowed"])
})

test("source policy version is stable for traces", () => {
  assert.equal(SOURCE_POLICY_VERSION, "source-policy-v1")
})

test("keyword RAG eval runner passes activation gate fixtures", () => {
  const report = runKeywordRagEvals()
  assert.equal(report.passed, true, JSON.stringify(report.cases.filter((item) => !item.passed)))
  assert.equal(report.failed, 0)
})

test("RAG activation eval report requires rollback criteria", () => {
  const report = parseRagActivationEvalReport(JSON.stringify({
    passed: true,
    rollbackCriteria: "disable if source grounding regresses",
  }))

  assert.equal(report.passed, true)
  assert.equal(report.rollbackCriteria, "disable if source grounding regresses")
})

test("RAG activation metadata is readable for admin monitoring", () => {
  const metadata = readRagActivationMetadata({
    activatedAt: "2026-07-03T12:00:00.000Z",
    activatedBy: "user_1",
    evalReport: {
      passed: true,
      rollbackCriteria: "disable if citation validation fails",
    },
  })

  assert.equal(metadata.evalPassed, true)
  assert.equal(metadata.activatedBy, "user_1")
  assert.equal(metadata.rollbackCriteria, "disable if citation validation fails")
})

test("pilot council validator rejects prohibited source impersonation language", () => {
  const run = buildLocalCouncilRun("I keep explaining before I choose.", analysis)
  const validated = validateCouncilRunForPilot({
    ...run,
    messages: run.messages.map((message, index) => index === 0 ? {
      ...message,
      content: "Maria says this is guaranteed.",
    } : message),
  }, { safety: { ...highSafety, severity: "low", allowReflectiveFlow: true } })

  assert.equal(validated.passed, false)
  assert.ok(validated.failedRules.includes("prohibited_claim_language"))
})

test("pilot eval runner covers planned fixtures", () => {
  const report = runPilotCouncilEvals()
  assert.equal(report.passed, true, JSON.stringify(report.cases.filter((item) => !item.passed)))
  assert.equal(report.total, 11)
})

test("pilot event properties remove raw journal text keys", () => {
  const sanitized = sanitizeProperties({
    rawText: "private",
    journalText: "private",
    text: "private",
    sourceMode: "rag",
  })
  assert.deepEqual(sanitized, { sourceMode: "rag" })
})

test("pilot launch readiness reports blocking launch conditions", () => {
  const report = evaluatePilotLaunchReadinessSnapshot({
    metrics: {
      activeCohorts: 0,
      enrolledUsers: 1,
      orientationCompleteUsers: 0,
      firstSessionsCompleted: 0,
      embodimentGateSaves: 0,
      unresolvedSafetyReviews: 1,
      qualityBlockers: 1,
      feedbackTotal: 0,
      sourceModeCounts: {},
    },
    sourceReadiness: {
      productDoctrineEligibleChunks: 0,
      currentMonthApprovedCurriculumDays: 0,
      currentMonthEligibleCurriculumChunks: 0,
      manuscriptEligibleChunks: 1,
      checkedMonth: 7,
    },
    latestEvalMetadata: {
      rag: { passed: false, total: 11, failed: 1 },
      pilot: { passed: false, total: 11, failed: 1 },
      ragActivationEvalPassed: false,
      ragEnabled: true,
      councilModeEnabled: false,
    },
  }, new Date("2026-07-03T12:00:00.000Z"))

  assert.equal(report.passed, false)
  assert.deepEqual(report.blockers.map((blocker) => blocker.code), [
    "no_active_cohort",
    "orientation_incomplete",
    "unresolved_safety_reviews",
    "quality_blockers",
    "council_mode_disabled",
    "rag_enabled_without_activation_eval",
    "rag_eval_failed",
    "pilot_eval_failed",
    "missing_product_doctrine_allowlist",
    "missing_current_month_curriculum",
    "manuscript_retrieval_eligible",
  ])
})

test("pilot launch readiness passes with internal-pilot prerequisites met", () => {
  const report = evaluatePilotLaunchReadinessSnapshot({
    metrics: {
      activeCohorts: 1,
      enrolledUsers: 2,
      orientationCompleteUsers: 2,
      firstSessionsCompleted: 0,
      embodimentGateSaves: 0,
      unresolvedSafetyReviews: 0,
      qualityBlockers: 0,
      feedbackTotal: 0,
      sourceModeCounts: { none: 2 },
    },
    sourceReadiness: {
      productDoctrineEligibleChunks: 3,
      currentMonthApprovedCurriculumDays: 1,
      currentMonthEligibleCurriculumChunks: 0,
      manuscriptEligibleChunks: 0,
      checkedMonth: 7,
    },
    latestEvalMetadata: {
      rag: { passed: true, total: 11, failed: 0 },
      pilot: { passed: true, total: 11, failed: 0 },
      ragActivationEvalPassed: false,
      ragEnabled: false,
      councilModeEnabled: true,
    },
  }, new Date("2026-07-03T12:00:00.000Z"))

  assert.equal(report.passed, true)
  assert.equal(report.blockers.length, 0)
  assert.ok(report.warnings.includes("RAG is off. Pilot reflections may use approved curriculum/product context only after the activation gate enables it."))
})

test("pilot iteration feedback disposition stays privacy-safe and reviewable", () => {
  assert.equal(readDisposition(undefined, "helpful"), "reviewed")
  assert.equal(readDisposition(undefined, "too_intense"), "needs_review")
  assert.equal(readDisposition({ feedbackDisposition: "blocked" }, "helpful"), "blocked")
  assert.equal(readDisposition({ feedbackDisposition: "cleared" }, "unsupported_source"), "cleared")
})

test("pilot learning report queues RAG and source feedback without raw journal text", () => {
  const report = buildPilotLearningReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    sourceModeRows: [
      { sourceMode: "rag", count: 1 },
      { sourceMode: "no_eligible_source", count: 1 },
    ],
    feedbackRows: [
      { feedbackType: "helpful", count: 1 },
      { feedbackType: "unsupported_source", count: 1 },
    ],
    safetyRows: [],
    blockers: [],
    sessions: [
      {
        id: "session_1",
        userEmail: "pilot@example.com",
        createdAt: new Date("2026-07-03T12:01:00.000Z"),
        sourceMode: "rag",
        feedbackTypes: ["unsupported_source"],
        qualityReviews: [],
        generationTraces: [
          {
            traceType: "retrieval",
            validationStatus: "selected",
            fallbackReason: null,
            sourceChunkId: "chunk_1",
            sourceTitle: "The Inner Council_",
            outputJson: {
              title: "The Inner Council_",
              matchReason: "Matched terms: council",
              allowedUse: "paraphrase_generation",
              displayExcerpt: null,
            },
          },
          {
            traceType: "council",
            validationStatus: "validated",
            fallbackReason: null,
            sourceChunkId: null,
            sourceTitle: null,
            outputJson: {
              pilotValidation: {
                warnings: ["rag_context_used_without_citations"],
                failedRules: [],
                citationCoverage: 1,
                evidenceCoverage: 1,
              },
            },
          },
        ],
      },
      {
        id: "session_2",
        userEmail: "pilot@example.com",
        createdAt: new Date("2026-07-03T12:02:00.000Z"),
        sourceMode: "no_eligible_source",
        feedbackTypes: [],
        qualityReviews: [{ label: "grounded", severity: "normal", metadata: { feedbackDisposition: "reviewed" } }],
        generationTraces: [
          {
            traceType: "retrieval",
            validationStatus: "no_eligible_source",
            fallbackReason: "No approved source matched.",
            sourceChunkId: null,
            sourceTitle: null,
            outputJson: { selected: [] },
          },
        ],
      },
    ],
  })

  assert.equal(report.sourceModeMetrics.rag, 1)
  assert.equal(report.sourceModeMetrics.no_eligible_source, 1)
  assert.equal(report.feedbackMetrics.unsupportedSource, 1)
  assert.equal(report.reviewCoverage.sourceSessions, 2)
  assert.equal(report.reviewCoverage.reviewedSourceSessions, 1)
  assert.equal(report.sourceGroundingMetrics.paraphraseOnlySelections, 1)
  assert.equal(report.sourceGroundingMetrics.displayExcerptCount, 0)
  assert.equal(report.ragLearningQueue[0]?.disposition, "needs_review")
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
})

test("pilot learning feedback disposition derives review state", () => {
  assert.equal(readFeedbackDisposition(undefined, ["helpful"]), "reviewed")
  assert.equal(readFeedbackDisposition(undefined, ["unsupported_source"]), "needs_review")
  assert.equal(readFeedbackDisposition({ feedbackDisposition: "cleared" }, ["unsupported_source"]), "cleared")
})
