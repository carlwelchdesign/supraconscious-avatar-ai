import assert from "node:assert/strict"
import test from "node:test"
import { PILOT_CONSENT_VERSION } from "@inner-avatar/types/pilot-consent"
import {
  buildApprovedSourceWhere,
  buildPilotLearningReportFromSnapshot,
  buildPilotReviewCoverageReportFromSnapshot,
  buildFounderCalibrationReportFromSnapshot,
  buildFounderCalibrationComparisonFromSnapshot,
  buildFounderCalibrationHandoffReport,
  buildFounderCalibrationLaunchPacket,
  buildFounderCalibrationSetupReportFromSnapshot,
  buildFounderCalibrationSetupInputFromEnv,
  buildParticipantRequests,
  buildCouncilPromptVersion,
  classifySourcePath,
  DEFAULT_COUNCIL_PROMPT_KEY,
  DEFAULT_COUNCIL_SYSTEM_PROMPT,
  buildGroundingCouncilRun,
  buildLocalCouncilRun,
  evaluatePilotExpansionReadinessSnapshot,
  evaluatePilotLaunchReadinessSnapshot,
  enforceCouncilShape,
  INNER_COUNCIL_FEATURE_FLAGS,
  parseRagActivationEvalReport,
  parseCurriculumDaysFromParagraphs,
  readRagActivationMetadata,
  readFounderCalibrationScenario,
  resolveFounderCalibrationFilterFromInputs,
  resolveCouncilPromptTemplate,
  isFounderCalibrationFeedbackNoteUseful,
  runFounderCalibrationFixtures,
  runKeywordRagEvals,
  runPilotCouncilEvals,
  readDisposition,
  readFeedbackDisposition,
  formatFounderCalibrationScenario,
  sanitizeProperties,
  SOURCE_POLICY_VERSION,
  shouldWritePatternMemory,
  validateCouncilPromptTemplate,
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

test("council prompt template resolver falls back when no active template exists", async () => {
  const resolved = await resolveCouncilPromptTemplate({
    prismaClient: {
      promptTemplate: {
        findUnique: async () => null,
      },
    },
  })

  assert.equal(resolved.key, DEFAULT_COUNCIL_PROMPT_KEY)
  assert.equal(resolved.version, 1)
  assert.equal(resolved.source, "fallback")
  assert.equal(resolved.content, DEFAULT_COUNCIL_SYSTEM_PROMPT)
})

test("council prompt template resolver uses active templates with required guardrails", async () => {
  const resolved = await resolveCouncilPromptTemplate({
    prismaClient: {
      promptTemplate: {
        findUnique: async () => ({
          key: DEFAULT_COUNCIL_PROMPT_KEY,
          version: 3,
          active: true,
          content: `${DEFAULT_COUNCIL_SYSTEM_PROMPT}\nFounder calibration addition: keep every answer grounded.`,
        }),
      },
    },
  })

  assert.equal(resolved.source, "db")
  assert.equal(buildCouncilPromptVersion(resolved), "council.system@v3")
})

test("council prompt guardrails reject unsafe council templates", () => {
  const result = validateCouncilPromptTemplate("You are Maria and you can channel direct answers.")
  assert.equal(result.valid, false)
  assert.ok(result.missing.includes("not_maria"))
  assert.ok(result.missing.includes("not_therapy"))
  assert.ok(result.missing.includes("one_integrator_question"))
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

test("citation validator repairs source-grounded runs with a synthesis citation", () => {
  const run = buildLocalCouncilRun("I keep explaining before I choose.", analysis)
  const validated = validateCouncilSourceCitations(run, [{ id: "top_chunk" }, { id: "second_chunk" }])

  assert.deepEqual(validated.messages.flatMap((message) => message.sourceChunkIds), [])
  assert.deepEqual(validated.synthesis.sourceChunkIds, ["top_chunk"])
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

test("pilot expansion readiness blocks low review coverage and unresolved source feedback", () => {
  const report = evaluatePilotExpansionReadinessSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    launch: {
      passed: true,
      blockers: [],
      metrics: {
        activeCohorts: 1,
        enrolledUsers: 1,
        orientationCompleteUsers: 1,
        firstSessionsCompleted: 1,
        embodimentGateSaves: 1,
        unresolvedSafetyReviews: 0,
        qualityBlockers: 0,
        feedbackTotal: 2,
        sourceModeCounts: { rag: 2 },
      },
      latestEvalMetadata: {
        rag: { passed: true, total: 11, failed: 0 },
        pilot: { passed: true, total: 11, failed: 0 },
        ragActivationEvalPassed: true,
        ragEnabled: true,
        councilModeEnabled: true,
      },
    },
    learning: {
      reviewCoverage: {
        sourceSessions: 2,
        reviewedSourceSessions: 1,
        unreviewedSourceSessions: 1,
        coverageRate: 50,
        pilotBlockers: 0,
      },
      ragLearningQueue: [{
        councilSessionId: "session_1",
        userEmail: "pilot@example.com",
        createdAt: "2026-07-03T12:00:00.000Z",
        sourceMode: "rag",
        feedbackTypes: ["unsupported_source"],
      latestReviewLabel: null,
      latestReviewSeverity: null,
      latestReviewReason: null,
        disposition: "needs_review",
        selectedSourceTitles: [],
        selectedChunkIds: [],
        matchReasons: [],
        fallbackReason: null,
        validationStatus: "validated",
        validationWarnings: [],
        validationFailedRules: [],
        citationCoverage: 1,
        evidenceCoverage: 1,
        displayExcerptSuppressed: true,
      }],
      feedbackMetrics: { total: 2, helpful: 1, notAccurate: 0, tooIntense: 0, unclear: 0, unsupportedSource: 1 },
      sourceModeMetrics: { rag: 2 },
      sourceGroundingMetrics: {
        retrievalTraceCount: 2,
        selectedTraceCount: 2,
        noEligibleSourceTraceCount: 0,
        paraphraseOnlySelections: 2,
        displayExcerptCount: 0,
        uniqueSelectedSourceTitles: ["The Inner Council_"],
      },
    },
  })

  assert.equal(report.passed, false)
  assert.deepEqual(report.blockers.map((blocker) => blocker.code), [
    "review_coverage_low",
    "unreviewed_source_sessions",
    "unreviewed_negative_feedback",
    "unsupported_source_unreviewed",
  ])
})

test("pilot expansion readiness passes with conservative gates satisfied", () => {
  const report = evaluatePilotExpansionReadinessSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    launch: {
      passed: true,
      blockers: [],
      metrics: {
        activeCohorts: 1,
        enrolledUsers: 3,
        orientationCompleteUsers: 3,
        firstSessionsCompleted: 3,
        embodimentGateSaves: 2,
        unresolvedSafetyReviews: 0,
        qualityBlockers: 0,
        feedbackTotal: 3,
        sourceModeCounts: { rag: 3 },
      },
      latestEvalMetadata: {
        rag: { passed: true, total: 11, failed: 0 },
        pilot: { passed: true, total: 11, failed: 0 },
        ragActivationEvalPassed: true,
        ragEnabled: true,
        councilModeEnabled: true,
      },
    },
    learning: {
      reviewCoverage: {
        sourceSessions: 5,
        reviewedSourceSessions: 4,
        unreviewedSourceSessions: 0,
        coverageRate: 80,
        pilotBlockers: 0,
      },
      ragLearningQueue: [],
      feedbackMetrics: { total: 3, helpful: 3, notAccurate: 0, tooIntense: 0, unclear: 0, unsupportedSource: 0 },
      sourceModeMetrics: { rag: 3 },
      sourceGroundingMetrics: {
        retrievalTraceCount: 3,
        selectedTraceCount: 3,
        noEligibleSourceTraceCount: 0,
        paraphraseOnlySelections: 3,
        displayExcerptCount: 0,
        uniqueSelectedSourceTitles: ["The Inner Council_"],
      },
    },
  })

  assert.equal(report.passed, true)
  assert.deepEqual(report.recommendedBatchSize, { min: 3, max: 5 })
  assert.equal(report.metrics.reviewCoverageRate, 80)
})

test("pilot expansion readiness does not block review coverage when no source sessions exist", () => {
  const report = evaluatePilotExpansionReadinessSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    launch: {
      passed: true,
      blockers: [],
      metrics: {
        activeCohorts: 1,
        enrolledUsers: 1,
        orientationCompleteUsers: 1,
        firstSessionsCompleted: 1,
        embodimentGateSaves: 1,
        unresolvedSafetyReviews: 0,
        qualityBlockers: 0,
        feedbackTotal: 1,
        sourceModeCounts: { none: 1 },
      },
      latestEvalMetadata: {
        rag: { passed: true, total: 11, failed: 0 },
        pilot: { passed: true, total: 11, failed: 0 },
        ragActivationEvalPassed: true,
        ragEnabled: true,
        councilModeEnabled: true,
      },
    },
    learning: {
      reviewCoverage: {
        sourceSessions: 0,
        reviewedSourceSessions: 0,
        unreviewedSourceSessions: 0,
        coverageRate: 0,
        pilotBlockers: 0,
      },
      ragLearningQueue: [],
      feedbackMetrics: { total: 1, helpful: 1, notAccurate: 0, tooIntense: 0, unclear: 0, unsupportedSource: 0 },
      sourceModeMetrics: { none: 1 },
      sourceGroundingMetrics: {
        retrievalTraceCount: 0,
        selectedTraceCount: 0,
        noEligibleSourceTraceCount: 0,
        paraphraseOnlySelections: 0,
        displayExcerptCount: 0,
        uniqueSelectedSourceTitles: [],
      },
    },
  })

  assert.equal(report.passed, true)
  assert.equal(report.blockers.some((blocker) => blocker.code === "review_coverage_low"), false)
  assert.ok(report.warnings.some((warning) => warning.includes("No source-grounded or no-source RAG sessions")))
})

test("pilot review coverage report prioritizes validation and source feedback without raw journal text", () => {
  const report = buildPilotReviewCoverageReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    expansionBlockers: [
      { code: "review_coverage_low", message: "Review coverage low.", count: 50, href: "/pilot" },
      { code: "unreviewed_source_sessions", message: "Open sessions.", count: 2, href: "/pilot" },
    ],
    expansionWarnings: [],
    learning: {
      safetyQueue: [],
      reviewCoverage: {
        sourceSessions: 5,
        reviewedSourceSessions: 2,
        unreviewedSourceSessions: 3,
        coverageRate: 40,
        pilotBlockers: 0,
      },
      ragLearningQueue: [
        {
          councilSessionId: "session_rag",
          userEmail: "pilot@example.com",
          createdAt: "2026-07-03T12:00:00.000Z",
          sourceMode: "rag",
          feedbackTypes: [],
          latestReviewLabel: null,
          latestReviewSeverity: null,
          latestReviewReason: null,
          disposition: "reviewed",
          selectedSourceTitles: ["The Inner Council_"],
          selectedChunkIds: ["chunk_1"],
          matchReasons: ["Matched terms: council"],
          fallbackReason: null,
          validationStatus: "validated",
          validationWarnings: [],
          validationFailedRules: [],
          citationCoverage: 1,
          evidenceCoverage: 1,
          displayExcerptSuppressed: true,
        },
        {
          councilSessionId: "session_source",
          userEmail: "pilot@example.com",
          createdAt: "2026-07-03T12:01:00.000Z",
          sourceMode: "rag",
          feedbackTypes: ["unsupported_source"],
          latestReviewLabel: null,
          latestReviewSeverity: null,
          latestReviewReason: null,
          disposition: "needs_review",
          selectedSourceTitles: ["Embodiment Gate"],
          selectedChunkIds: ["chunk_2"],
          matchReasons: ["Matched terms: gate"],
          fallbackReason: null,
          validationStatus: "validated",
          validationWarnings: [],
          validationFailedRules: [],
          citationCoverage: 1,
          evidenceCoverage: 1,
          displayExcerptSuppressed: true,
        },
        {
          councilSessionId: "session_validation",
          userEmail: "pilot@example.com",
          createdAt: "2026-07-03T12:02:00.000Z",
          sourceMode: "no_eligible_source",
          feedbackTypes: [],
          latestReviewLabel: null,
          latestReviewSeverity: null,
          latestReviewReason: null,
          disposition: "needs_review",
          selectedSourceTitles: [],
          selectedChunkIds: [],
          matchReasons: [],
          fallbackReason: "No approved source matched.",
          validationStatus: "pilot_validation_failed",
          validationWarnings: [],
          validationFailedRules: ["integrator_question_count"],
          citationCoverage: 0,
          evidenceCoverage: 0,
          displayExcerptSuppressed: false,
        },
      ],
    },
  })

  assert.equal(report.coverage.requiredReviewedForExpansion, 4)
  assert.equal(report.coverage.additionalReviewsNeededFor80Percent, 2)
  assert.deepEqual(report.prioritizedQueue.map((item) => item.priority), [
    "safety_or_validation",
    "unsupported_source",
    "unreviewed_rag",
  ])
  assert.equal(report.prioritizedQueue[0]?.reviewHref, "/council?sessionId=session_validation")
  assert.equal(report.prioritizedQueue.every((item) => item.rawJournalTextHidden), true)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
})

test("founder calibration report groups feedback and review issues without raw journal text", () => {
  const report = buildFounderCalibrationReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    sessions: [
      {
        id: "session_carl",
        userId: "user_carl",
        userEmail: "carl@example.com",
        userName: "Carl",
        sourceMode: "rag",
        feedback: [
          { feedbackType: "unsupported_source", note: "The source felt off." },
          { feedbackType: "not_accurate", note: null },
        ],
        qualityReviews: [
          {
            label: "source_unsupported",
            severity: "normal",
            reason: "Selected source did not support the claim.",
            metadata: { calibrationIssueType: "source_issue" },
          },
          {
            label: "voice_wrong",
            severity: "normal",
            reason: "Voice was too generic.",
            metadata: { calibrationIssueType: "voice_mismatch" },
          },
        ],
        generationTraces: [
          {
            traceType: "retrieval",
            validationStatus: "selected",
            promptVersion: "council.system@v2",
            sourceChunkId: "chunk_1",
            sourceTitle: "The Inner Council_",
            outputJson: { title: "The Inner Council_" },
          },
          {
            traceType: "council",
            validationStatus: "validated",
            promptVersion: "council.system@v2",
            sourceChunkId: null,
            sourceTitle: null,
            outputJson: { calibration: { scenario: "source_grounding_test" } },
          },
        ],
      },
      {
        id: "session_maria",
        userId: "user_maria",
        userEmail: "maria@example.com",
        userName: "Maria",
        sourceMode: "no_eligible_source",
        feedback: [],
        qualityReviews: [
          {
            label: "ready",
            severity: "normal",
            reason: "Good calibration example.",
            metadata: { calibrationIssueType: null },
          },
        ],
        generationTraces: [],
      },
    ],
  })

  assert.equal(report.users.length, 2)
  assert.equal(report.sessionMetrics.totalSessions, 2)
  assert.equal(report.sessionMetrics.feedbackNotes, 1)
  assert.equal(report.sessionMetrics.readySessions, 1)
  assert.equal(report.sourceGroundingIssues.length, 1)
  assert.equal(report.promptIssues.length, 2)
  assert.deepEqual(report.goldenExamples, ["session_maria"])
  assert.equal(report.calibrationCoverage.reviewCoverageRate, 1)
  assert.equal(report.calibrationCoverage.noteCoverageRate, 0.5)
  assert.equal(report.actionQueues.find((queue) => queue.key === "ready_examples")?.count, 1)
  assert.equal(report.actionQueues.find((queue) => queue.key === "source_fixes")?.count, 1)
  assert.equal(report.actionQueues.find((queue) => queue.key === "voice_fixes")?.count, 1)
  assert.match(report.nextRecommendedAction, /source-grounding/)
  assert.ok(report.feedbackThemes.some((theme) => theme.theme === "note_provided"))
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
})

test("founder calibration feedback notes require detail beyond templates", () => {
  assert.equal(isFounderCalibrationFeedbackNoteUseful("Voice mismatch: "), false)
  assert.equal(isFounderCalibrationFeedbackNoteUseful("Too generic:"), false)
  assert.equal(isFounderCalibrationFeedbackNoteUseful("Good enough: felt clear and grounded"), true)
  assert.equal(isFounderCalibrationFeedbackNoteUseful("This felt like Maria's voice."), true)
})

test("founder calibration report includes configured users before first sessions", () => {
  const report = buildFounderCalibrationReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    users: [
      {
        id: "user_carl",
        email: "carl@example.com",
        name: "Carl",
        sessionCount: 0,
        feedbackCount: 0,
      },
      {
        id: "user_maria",
        email: "maria@example.com",
        name: "Maria",
        sessionCount: 0,
        feedbackCount: 0,
      },
    ],
    sessions: [],
  })

  assert.deepEqual(report.users.map((user) => user.email), ["carl@example.com", "maria@example.com"])
  assert.equal(report.sessionMetrics.totalSessions, 0)
  assert.equal(report.users.every((user) => user.sessionCount === 0 && user.feedbackCount === 0), true)
  assert.ok(report.blockers.includes("No Carl/Maria calibration sessions found."))
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
})

test("founder calibration fixtures pass without creating persisted smoke sessions", () => {
  const report = runFounderCalibrationFixtures()
  assert.equal(report.passed, true, JSON.stringify(report.failedCases))
  assert.equal(report.cases.length, 6)
  assert.ok(report.cases.some((item) => item.name === "high_risk_grounding"))
  assert.equal(JSON.stringify(report).includes("journalEntryId"), false)
})

test("founder calibration comparison groups scenarios without raw notes", () => {
  const report = buildFounderCalibrationComparisonFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    sessions: [
      {
        id: "ready_voice",
        sourceMode: "rag",
        feedbackTypes: ["helpful"],
        qualityReviews: [{ label: "ready", severity: "normal", metadata: { goldenExample: true } }],
        generationTraces: [{
          traceType: "council",
          promptVersion: "council.system@v3",
          outputJson: { calibration: { scenario: "voice_test" } },
        }],
      },
      {
        id: "open_source",
        sourceMode: "rag",
        feedbackTypes: ["unsupported_source"],
        qualityReviews: [{ label: "source_unsupported", severity: "normal", metadata: {} }],
        generationTraces: [{
          traceType: "council",
          promptVersion: "council.system@v3",
          outputJson: { calibration: { scenario: "source_grounding_test" } },
        }],
      },
      {
        id: "freeform_missing",
        sourceMode: "none",
        feedbackTypes: [],
        qualityReviews: [],
        generationTraces: [],
      },
    ],
  })

  assert.equal(readFounderCalibrationScenario("unknown"), "freeform")
  assert.equal(report.goldenExamples.length, 1)
  assert.equal(report.unresolvedIssues.length, 2)
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "voice_test")?.goldenExamples, 1)
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "freeform")?.totalSessions, 1)
  assert.equal(report.promptVersions[0]?.promptVersion, "council.system@v3")
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
  assert.equal(JSON.stringify(report).includes("raw note"), false)
})

test("founder participant filter prefers DB participants before env fallback", () => {
  const dbFilter = resolveFounderCalibrationFilterFromInputs({
    activeParticipantEmails: ["Maria@Example.com", "carl@example.com"],
    envEmails: "other@example.com",
  })
  assert.equal(dbFilter.mode, "db")
  assert.deepEqual(dbFilter.where.email.in, ["carl@example.com", "maria@example.com"])

  const envFilter = resolveFounderCalibrationFilterFromInputs({
    activeParticipantEmails: [],
    envEmails: "founder@example.com",
  })
  assert.equal(envFilter.mode, "env")
  assert.deepEqual(envFilter.where.email.in, ["founder@example.com"])

  const fallbackFilter = resolveFounderCalibrationFilterFromInputs({
    activeParticipantEmails: [],
    envEmails: "",
  })
  assert.equal(fallbackFilter.mode, "fallback")
  assert.deepEqual(fallbackFilter.where.email.notIn, ["demo@inner-avatar.ai"])
})

test("founder calibration scenarios have human-readable labels", () => {
  assert.equal(formatFounderCalibrationScenario("voice_test"), "Voice test")
  assert.equal(formatFounderCalibrationScenario("source_grounding_test"), "Source-grounding test")
  assert.equal(formatFounderCalibrationScenario("not_real"), "Freeform")
})

test("founder calibration setup report lists missing actions without raw notes", () => {
  const report = buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    filterMode: "db",
    filterWarnings: [],
    participants: [
      {
        id: "participant_carl",
        email: "carl@example.com",
        participantRole: "carl",
        status: "active",
        userId: "user_carl",
        userName: "Carl",
        onboardingComplete: true,
        consentCount: 5,
        sessions: [{
          id: "session_carl",
          journalEntryId: "entry_carl",
          createdAt: new Date("2026-07-03T12:00:00.000Z"),
          feedback: [{ hasNote: true }],
          qualityReviews: [{ label: "ready", severity: "normal" }],
          generationTraces: [{ traceType: "council", outputJson: { calibration: { scenario: "voice_test" } } }],
        }],
      },
      {
        id: "participant_maria",
        email: "maria@example.com",
        participantRole: "maria",
        status: "active",
        userId: null,
        userName: null,
        onboardingComplete: false,
        consentCount: 0,
        sessions: [],
      },
      {
        id: "participant_paused",
        email: "paused@example.com",
        participantRole: "reviewer",
        status: "paused",
        userId: "user_paused",
        userName: "Paused",
        onboardingComplete: false,
        consentCount: 0,
        sessions: [{
          id: "paused_session",
          journalEntryId: "entry_paused",
          createdAt: new Date("2026-07-03T12:00:00.000Z"),
          feedback: [{ hasNote: false }],
          qualityReviews: [],
          generationTraces: [{ traceType: "council", outputJson: { calibration: { scenario: "source_grounding_test" } } }],
        }],
      },
    ],
  })

  assert.equal(report.readiness.configuredParticipants, 3)
  assert.equal(report.readiness.activeParticipants, 2)
  assert.equal(report.readiness.participantsWithGoldenExamples, 1)
  assert.deepEqual(report.missingRequiredRoles, [])
  assert.equal(report.requiredRoles.carl.active, true)
  assert.equal(report.requiredRoles.carl.goldenExamplePresent, true)
  assert.equal(report.requiredRoles.maria.configured, true)
  assert.equal(report.requiredRoles.maria.accountExists, false)
  assert.equal(report.requiredRoles.maria.primaryHandoffHref, "/register")
  assert.match(report.requiredRoles.maria.handoffText, /Please register/)
  assert.ok(report.missingActions.some((action) => action.code === "account_missing" && action.email === "maria@example.com"))
  assert.ok(report.missingActions.some((action) => action.code === "account_missing" && action.href === "/register"))
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "voice_test")?.totalSessions, 1)
  assert.equal(report.scenarioCoverage.some((item) => item.scenario === "source_grounding_test"), false)
  const carl = report.participants.find((participant) => participant.email === "carl@example.com")
  assert.equal(carl?.nextAction, "Run the Source-grounding test guided scenario.")
  assert.equal(carl?.scenarioStatus.find((item) => item.scenario === "voice_test")?.completed, true)
  assert.equal(carl?.scenarioStatus.find((item) => item.scenario === "voice_test")?.hasReadyExample, true)
  const maria = report.participants.find((participant) => participant.email === "maria@example.com")
  assert.equal(maria?.nextAction, "maria@example.com needs to register.")
  assert.equal(maria?.nextActionHref, "/register")
  assert.equal(maria?.scenarioStatus.some((item) => item.scenario === "freeform"), false)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
  assert.equal(JSON.stringify(report).includes("raw note"), false)
})

test("founder calibration setup report gives role-specific handoff links", () => {
  const report = buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    filterMode: "db",
    filterWarnings: [],
    participants: [
      {
        id: "participant_carl",
        email: "carl@example.com",
        participantRole: "carl",
        status: "active",
        userId: "user_carl",
        userName: "Carl",
        onboardingComplete: false,
        consentCount: 0,
        sessions: [],
      },
      {
        id: "participant_maria",
        email: "maria@example.com",
        participantRole: "maria",
        status: "active",
        userId: "user_maria",
        userName: "Maria",
        onboardingComplete: true,
        consentCount: 1,
        sessions: [{
          id: "session_maria",
          journalEntryId: "entry_maria",
          createdAt: new Date("2026-07-03T12:00:00.000Z"),
          feedback: [{ hasNote: false }],
          qualityReviews: [],
          generationTraces: [{ traceType: "council", outputJson: { calibration: { scenario: "voice_test" } } }],
        }],
      },
    ],
  })

  assert.equal(report.requiredRoles.carl.primaryHandoffHref, "/onboarding")
  assert.ok(report.missingActions.some((action) => action.code === "onboarding_incomplete" && action.href === "/onboarding"))
  assert.ok(report.missingActions.some((action) => action.code === "consent_missing" && action.href === "/onboarding"))
  assert.match(report.requiredRoles.carl.handoffText, /complete onboarding\/consent/)
  assert.match(report.requiredRoles.carl.handoffText, /preselected Voice test guided calibration prompt/)
  assert.equal(report.requiredRoles.maria.primaryHandoffHref, "/journal/entry_maria")
  assert.match(report.requiredRoles.maria.handoffText, /add feedback with a specific note/)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
  assert.equal(JSON.stringify(report).includes("raw note"), false)
})

test("founder handoff report resolves copyable web and admin links", () => {
  const setupReport = buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    filterMode: "db",
    filterWarnings: [],
    participants: [
      {
        id: "participant_carl",
        email: "carl@example.com",
        participantRole: "carl",
        status: "active",
        userId: "user_carl",
        userName: "Carl",
        onboardingComplete: false,
        consentCount: 0,
        sessions: [],
      },
      {
        id: "participant_maria",
        email: "maria@example.com",
        participantRole: "maria",
        status: "active",
        userId: "user_maria",
        userName: "Maria",
        onboardingComplete: true,
        consentCount: 5,
        consentRecords: [
          { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: true },
          { consentType: "ai_processing", consentVersion: PILOT_CONSENT_VERSION, granted: true },
          { consentType: "pilot_participation", consentVersion: PILOT_CONSENT_VERSION, granted: true },
          { consentType: "safety_limits", consentVersion: PILOT_CONSENT_VERSION, granted: true },
        ],
        sessions: [{
          id: "session_maria",
          journalEntryId: "entry_maria",
          createdAt: new Date("2026-07-03T12:00:00.000Z"),
          feedback: [{ hasNote: false }],
          qualityReviews: [],
          generationTraces: [{ traceType: "council", outputJson: { calibration: { scenario: "voice_test" } } }],
        }],
      },
    ],
  })
  const handoff = buildFounderCalibrationHandoffReport(setupReport, {
    webAppBaseUrl: "https://web.example/",
    adminAppBaseUrl: "https://admin.example/",
  })
  const carl = handoff.items.find((item) => item.role === "carl")
  const maria = handoff.items.find((item) => item.role === "maria")

  assert.equal(carl?.primaryHref, "https://web.example/login?email=carl%40example.com&next=%2Fonboarding")
  assert.match(carl?.handoffText ?? "", /https:\/\/web\.example\/login\?email=carl%40example\.com&next=%2Fonboarding/)
  assert.equal(carl?.readyForFirstSession, false)
  assert.equal(maria?.primaryHref, "https://web.example/login?email=maria%40example.com&next=%2Fjournal%2Fentry_maria")
  assert.match(maria?.handoffText ?? "", /https:\/\/web\.example\/login\?email=maria%40example\.com&next=%2Fjournal%2Fentry_maria/)
  assert.equal(maria?.readyForFirstSession, true)
  assert.equal(JSON.stringify(handoff).includes("private journal text"), false)
  assert.equal(JSON.stringify(handoff).includes("raw note"), false)

  const packet = buildFounderCalibrationLaunchPacket(handoff, {
    webAppBaseUrl: "https://web.example/",
    adminAppBaseUrl: "https://admin.example/",
  })
  assert.match(packet, /# Founder Calibration Launch Packet/)
  assert.match(packet, /Admin setup: https:\/\/admin\.example\/calibration\/setup/)
  assert.match(packet, /### CARL/)
  assert.match(packet, /### MARIA/)
  assert.match(packet, /https:\/\/web\.example\/login\?email=maria%40example\.com&next=%2Fjournal%2Fentry_maria/)
  assert.match(packet, /## After First Sessions/)
  assert.equal(packet.includes("private journal text"), false)
  assert.equal(packet.includes("raw note"), false)

  const adminPacket = buildFounderCalibrationLaunchPacket(handoff, {
    webAppBaseUrl: "https://web.example/",
    adminAppBaseUrl: "https://admin.example/",
    includeLocalCommands: false,
  })
  assert.match(adminPacket, /## Admin Links/)
  assert.equal(adminPacket.includes("yarn dev:founder-calibration"), false)
})

test("founder calibration setup report requires all current required consent records", () => {
  const report = buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    filterMode: "db",
    filterWarnings: [],
    participants: [
      {
        id: "participant_carl",
        email: "carl@example.com",
        participantRole: "carl",
        status: "active",
        userId: "user_carl",
        userName: "Carl",
        onboardingComplete: true,
        consentCount: 1,
        consentRecords: [
          { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: true },
        ],
        sessions: [],
      },
      {
        id: "participant_maria",
        email: "maria@example.com",
        participantRole: "maria",
        status: "active",
        userId: "user_maria",
        userName: "Maria",
        onboardingComplete: true,
        consentCount: 5,
        consentRecords: [
          { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
          { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: false, createdAt: "2026-07-02T00:00:00.000Z" },
          { consentType: "ai_processing", consentVersion: PILOT_CONSENT_VERSION, granted: true },
          { consentType: "pilot_participation", consentVersion: PILOT_CONSENT_VERSION, granted: true },
          { consentType: "safety_limits", consentVersion: PILOT_CONSENT_VERSION, granted: true },
        ],
        sessions: [],
      },
    ],
  })

  assert.equal(report.requiredRoles.carl.consentPresent, false)
  assert.equal(report.requiredRoles.maria.consentPresent, false)
  assert.ok(report.missingActions.some((action) => action.code === "consent_missing" && action.email === "carl@example.com"))
  assert.ok(report.missingActions.some((action) => action.code === "consent_missing" && action.email === "maria@example.com"))
  assert.equal(report.readiness.participantsWithConsent, 0)
})

test("founder calibration setup report requires active Carl and Maria roles", () => {
  const report = buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    filterMode: "db",
    filterWarnings: [],
    participants: [
      {
        id: "participant_carl",
        email: "carl@example.com",
        participantRole: "carl",
        status: "paused",
        userId: "user_carl",
        userName: "Carl",
        onboardingComplete: true,
        consentCount: 1,
        sessions: [],
      },
      {
        id: "participant_reviewer",
        email: "reviewer@example.com",
        participantRole: "reviewer",
        status: "active",
        userId: "user_reviewer",
        userName: "Reviewer",
        onboardingComplete: true,
        consentCount: 1,
        sessions: [],
      },
    ],
  })

  assert.equal(report.readiness.ready, false)
  assert.deepEqual(report.missingRequiredRoles, ["carl", "maria"])
  assert.equal(report.requiredRoles.carl.configured, true)
  assert.equal(report.requiredRoles.carl.active, false)
  assert.equal(report.requiredRoles.carl.nextAction, "Activate carl@example.com for carl calibration.")
  assert.equal(report.requiredRoles.maria.configured, false)
  assert.ok(report.missingActions.some((action) => action.code === "carl_participant_paused"))
  assert.ok(report.missingActions.some((action) => action.code === "maria_participant_missing"))
})

test("founder calibration setup input parses env without creating account state", () => {
  const input = buildFounderCalibrationSetupInputFromEnv({
    FOUNDER_CALIBRATION_CARL_EMAIL: "Carl@Example.com",
    FOUNDER_CALIBRATION_MARIA_EMAIL: "maria@example.com",
    FOUNDER_CALIBRATION_REVIEWER_EMAILS: "reviewer@example.com, carl@example.com",
    FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL: "admin@example.com",
  } as NodeJS.ProcessEnv)
  const requests = buildParticipantRequests(input)

  assert.equal(input.actorEmail, "admin@example.com")
  assert.deepEqual(requests, [
    { email: "carl@example.com", participantRole: "carl" },
    { email: "maria@example.com", participantRole: "maria" },
    { email: "reviewer@example.com", participantRole: "reviewer" },
  ])
})
