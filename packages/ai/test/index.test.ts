import assert from "node:assert/strict"
import test from "node:test"
import "./active-runtime-doctrine-guard.test.js"
import { PILOT_CONSENT_VERSION } from "@inner-avatar/types/pilot-consent"
import { languageInstruction } from "@inner-avatar/ai/response-language"
import {
  buildApprovedSourceWhere,
  buildAccountExportPayload,
  buildPilotLearningReportFromSnapshot,
  buildPilotReviewCoverageReportFromSnapshot,
  buildFounderCalibrationReportFromSnapshot,
  buildFounderCalibrationComparisonFromSnapshot,
  buildFounderCalibrationHandoffReport,
  buildFounderCalibrationLaunchPacket,
  buildFounderCalibrationJournalReadiness,
  buildJournalEntryCreateArgs,
  buildSourceProvenanceMessage,
  buildFounderCalibrationSetupReportFromSnapshot,
  authorizeDoctrineRevision,
  ACTIVE_REFLECTION_RUNTIME_POLICY,
  ACTIVE_REFLECTION_RUNTIME_VERSION,
  buildDoctrineTraceMetadata,
  authorizeGuideVoiceReference,
  buildGuideVoiceTraceMetadata,
  CURATED_PROMPTS,
  DIMENSION_CONTRACT,
  DOCTRINE_CONTRACT,
  DOCTRINE_CONTRACT_VERSION,
  GUIDE_VOICE_CONTRACT,
  GUIDE_VOICE_CONTRACT_VERSION,
  GUIDE_VOICE_SYSTEM_PROMPT,
  FOUNDER_CONTEXT_SOURCES,
  FOUNDER_CONTEXT_REGISTRY_VERSION,
  FOUNDER_DECISIONS,
  FOUNDER_DECISION_REGISTRY_VERSION,
  LOCKED_DOCTRINE,
  buildFounderCalibrationSetupInputFromEnv,
  buildParticipantRequests,
  buildFounderParticipantAuditMetadata,
  buildGenerationTraceLangSmithMetadata,
  DEFAULT_GUIDE_STAGE_CONFIGS,
  mergeGuideStageConfigs,
  hashFounderParticipantEmailForAudit,
  hashEmailForAudit,
  buildCouncilPromptVersion,
  classifySourcePath,
  DEFAULT_COUNCIL_PROMPT_KEY,
  DEFAULT_COUNCIL_SYSTEM_PROMPT,
  buildGroundingCouncilRun,
  buildLocalCouncilRun,
  buildCrisisGroundingContent,
  detectHighRiskCategories,
  evaluatePilotExpansionReadinessSnapshot,
  evaluatePilotLaunchReadinessSnapshot,
  enforceCouncilShape,
  INNER_COUNCIL_FEATURE_FLAGS,
  parseRagActivationEvalReport,
  parseCurriculumDaysFromParagraphs,
  readRagActivationMetadata,
  readFounderCalibrationScenario,
  inferFounderCalibrationScenarioFromText,
  isLangSmithEnabled,
  isFounderCalibrationUser,
  resolveFounderCalibrationFilterFromInputs,
  resolveCouncilPromptTemplate,
  hasUsableSourceRightsGrant,
  isFounderCalibrationFeedbackNoteUseful,
  runFounderCalibrationFixtures,
  runKeywordRagEvals,
  runPilotCouncilEvals,
  readDisposition,
  readFeedbackDisposition,
  readGuideStageConfig,
  readGuideStageNames,
  buildReasoningGraphFromChunks,
  defaultReasoningScopeForSourceType,
  buildCouncilPromptInput,
  generateReasoningGraphAiInsights,
  validateReasoningGraphAiInsights,
  validateReasoningOntologyProposal,
  retrieveApprovedOntologyNeighborhood,
  generateReasoningOntologyProposal,
  isReasoningGraphConceptAllowed,
  resolvePilotEventInputHash,
  normalizeGuideStage,
  normalizePdfTextToParagraphs,
  parseObsidianMarkdown,
  formatFounderCalibrationScenario,
  generateAvatarResponse,
  generateSymbolicPrompt,
  sanitizeProperties,
  sanitizeLangSmithMetadata,
  setLangSmithClientFactoryForTests,
  SOURCE_POLICY_VERSION,
  SAFETY_POLICY_VERSION,
  shouldShortCircuitReflection,
  shouldWritePatternMemory,
  resetLangSmithClientFactoryForTests,
  runActiveReflection,
  runLangSmithObservabilityCheck,
  validateCouncilPromptTemplate,
  validateCouncilRunForPilot,
  validateCouncilSourceCitations,
  validateFounderContextRegistry,
  evaluateFounderDecisionGates,
  resolveFounderDecision,
  validateFounderDecisionRegistry,
  validateGuideVoiceText,
  validatePublicCopyAgainstDoctrine,
  type GraphRagContext,
  withLangSmithRun,
  type EntryAnalysis,
  type SafetyCheck,
} from "../src/index.js"

test("deterministic safety policy short-circuits every P0 high-risk category", () => {
  const cases = [
    ["acute_crisis", "I can't go on and I need urgent help."],
    ["self_harm", "I am going to kill myself tonight."],
    ["harm_to_others", "I am going to hurt someone right now."],
    ["immediate_danger", "I am not safe right now and need help."],
    ["severe_dissociation", "I can't tell what's real and I am losing time right now."],
    ["psychosis_like_destabilization", "The voices are commanding me to attack someone."],
    ["psychosis_like_destabilization", "They are tracking me and no one believes me."],
  ] as const

  for (const [category, text] of cases) {
    assert.equal(detectHighRiskCategories(text).includes(category), true, category)
  }

  assert.equal(SAFETY_POLICY_VERSION, "supraconscious-safety-short-circuit-v1")
})

test("crisis grounding is plain and excludes reflective mechanics", () => {
  const grounding = buildCrisisGroundingContent({
    userMessage: "Pause reflection and contact immediate support.",
  })
  const combined = Object.values(grounding).join(" ")

  assert.equal(shouldShortCircuitReflection({ severity: "high", allowReflectiveFlow: true }), true)
  assert.equal(shouldShortCircuitReflection({ severity: "medium", allowReflectiveFlow: false }), true)
  assert.doesNotMatch(combined, /\b(?:dimension|story|fear|ego|genius|visuali[sz]e|close your eyes|act as if)\b/i)
  assert.match(combined, /support|emergency|crisis/i)
})

test("founder context registry preserves the locked doctrine and four-source precedence", () => {
  const result = validateFounderContextRegistry()

  assert.equal(FOUNDER_CONTEXT_REGISTRY_VERSION, "founder-context-v1")
  assert.equal(result.valid, true, result.errors.join(", "))
  assert.equal(result.sourceCount, 4)
  assert.deepEqual(FOUNDER_CONTEXT_SOURCES.map((source) => source.precedence), [1, 2, 3, 4])
  assert.equal(FOUNDER_CONTEXT_SOURCES.every((source) => source.retrievalState === "blocked"), true)
  assert.equal(LOCKED_DOCTRINE.entryTerm, "Mirror")
  assert.equal(LOCKED_DOCTRINE.guidePersona, "constant")
  assert.equal(LOCKED_DOCTRINE.directMariaAttribution, "prohibited")
})

test("curated founder prompt registry contains exact governed metadata for 10 physical and 14 mental prompts", () => {
  const result = validateFounderContextRegistry()

  assert.equal(result.valid, true, result.errors.join(", "))
  assert.equal(result.promptCount, 24)
  assert.equal(result.physicalCount, 10)
  assert.equal(result.mentalCount, 14)
  assert.equal(new Set(CURATED_PROMPTS.map((prompt) => prompt.key)).size, 24)
  assert.equal(
    CURATED_PROMPTS.every(
      (prompt) =>
        prompt.version === 1 &&
        prompt.sourceWork.length > 0 &&
        prompt.originalExercise.length > 0 &&
        prompt.dimensions.length > 0 &&
        prompt.approvalState === "founder_supplied" &&
        prompt.rightsState === "needs_legal_review" &&
        prompt.retrievalState === "blocked",
    ),
    true,
  )
})

test("every curated user-facing prompt passes prohibited-language policy", () => {
  for (const prompt of CURATED_PROMPTS) {
    const result = validatePublicCopyAgainstDoctrine(
      [prompt.publicTitle, prompt.publicText].filter(Boolean).join("\n"),
    )
    assert.equal(result.valid, true, `${prompt.key}: ${result.issues.join(", ")}`)
  }
})

test("founder decision registry preserves approved evidence while keeping open decisions explicit", () => {
  const validation = validateFounderDecisionRegistry()
  const gates = evaluateFounderDecisionGates()
  const sourceClearance = FOUNDER_DECISIONS.find(
    (decision) => decision.id === "additional_source_clearance",
  )

  assert.equal(FOUNDER_DECISION_REGISTRY_VERSION, "founder-decisions-v2")
  assert.equal(validation.valid, true, validation.errors.join(", "))
  assert.equal(FOUNDER_DECISIONS.length, 10)
  assert.equal(gates.pendingCount, 9)
  assert.equal(gates.gates.internal_schema, true)
  assert.equal(gates.gates.prompt_release, false)
  assert.equal(gates.gates.returning_user_progression, false)
  assert.equal(gates.gates.broader_pilot, false)
  assert.equal(sourceClearance?.status, "approved")
  assert.equal(sourceClearance?.decidedAt, "2026-07-31")
  assert.deepEqual(sourceClearance?.evidence, [
    {
      sourceKey: "founder_decision_brief_v3",
      locator: "Sections 11, A, B, and C.3",
    },
  ])
})

test("founder decisions require a dated answer and rationale before clearing gates", () => {
  assert.throws(
    () =>
      resolveFounderDecision("dimension_selection_rule", {
        status: "approved",
        decision: " ",
        rationale: "Founder confirmation.",
        decidedAt: "2026-07-30",
        evidence: [
          {
            sourceKey: "founder_decision_brief_v3",
            locator: "Section 5",
          },
        ],
      }),
    /invalid_founder_decision_resolution/,
  )

  const resolved = resolveFounderDecision("dimension_selection_rule", {
    status: "approved",
    decision: "Use only the approved founder rule.",
    rationale: "Recorded as a test fixture, not a production founder answer.",
    decidedAt: "2026-07-30",
    evidence: [
      {
        sourceKey: "founder_decision_brief_v3",
        locator: "Section 5",
      },
    ],
  })
  const gates = evaluateFounderDecisionGates(resolved)

  assert.equal(gates.gates.returning_user_progression, true)
  assert.equal(gates.gates.prompt_release, false)
})

test("founder decision resolutions require registered written evidence", () => {
  assert.throws(
    () =>
      resolveFounderDecision("dimension_selection_rule", {
        status: "approved",
        decision: "Use only the approved founder rule.",
        rationale: "Recorded as a test fixture, not a production founder answer.",
        decidedAt: "2026-07-30",
        evidence: [],
      }),
    /invalid_founder_decision_resolution/,
  )

  const invalidEvidence = FOUNDER_DECISIONS.map((decision) =>
    decision.id === "additional_source_clearance"
      ? {
          ...decision,
          evidence: [{ sourceKey: "unknown_source" as never, locator: "Section 1" }],
        }
      : decision,
  )
  const validation = validateFounderDecisionRegistry(invalidEvidence)

  assert.equal(validation.valid, false)
  assert.ok(
    validation.errors.includes(
      "resolved_decision_missing_evidence:additional_source_clearance",
    ),
  )
})

test("doctrine contract defines seven equal dimensions and a constant Guide", () => {
  assert.equal(DOCTRINE_CONTRACT_VERSION, "supraconscious-doctrine-v1")
  assert.equal(Object.keys(DIMENSION_CONTRACT).length, 7)
  assert.equal(DOCTRINE_CONTRACT.entry.term, "Mirror")
  assert.equal(DOCTRINE_CONTRACT.observer.isDimension, false)
  assert.equal(DOCTRINE_CONTRACT.guide.persona, "constant")
  assert.equal(DOCTRINE_CONTRACT.guide.progressionOwner, "user")
  assert.equal(DOCTRINE_CONTRACT.promptPolicy.modelMayRewrite, false)
  assert.equal(DOCTRINE_CONTRACT.agency.embodimentIsOptional, true)
})

test("active reflection runtime fail-closes legacy orchestration and persona progression", async () => {
  const calls: Array<{ user: Record<string, unknown>; input: Record<string, unknown> }> = []
  const expected = { journalEntry: { id: "entry-1" } }
  const result = await runActiveReflection(
    {
      id: "user-1",
      avatarTone: "gentle",
      intensityLevel: 2,
      currentLevel: 3,
      avatarStage: 5,
      patternMemoryEnabled: true,
    },
    { text: "I want to see this situation more clearly before I choose." },
    {
      runLegacyReflection: async (user, input) => {
        calls.push({ user, input })
        return expected as never
      },
    },
  )

  assert.equal(ACTIVE_REFLECTION_RUNTIME_VERSION, "supraconscious-active-reflection-v1")
  assert.equal(ACTIVE_REFLECTION_RUNTIME_POLICY.guidePersona, "constant")
  assert.equal(ACTIVE_REFLECTION_RUNTIME_POLICY.legacyCouncilOrchestration, false)
  assert.equal(ACTIVE_REFLECTION_RUNTIME_POLICY.legacyPersonaStages, false)
  assert.equal(calls.length, 1)
  assert.equal(calls[0]?.user.avatarStage, 1)
  assert.equal(calls[0]?.input.councilModeEnabled, false)
  assert.equal(calls[0]?.input.ragEnabled, false)
  assert.equal(calls[0]?.input.personaStageProgressionEnabled, false)
  assert.equal(result, expected)
})

test("new public copy rejects superseded doctrine while historical payloads remain renderable", () => {
  const rejected = validatePublicCopyAgainstDoctrine(
    "Maria teaches that the Inner Council unlocks the Clear Mirror level.",
  )
  const historical = validatePublicCopyAgainstDoctrine(
    "Maria teaches that the Inner Council unlocks the Clear Mirror level.",
    { contentMode: "historical_payload" },
  )

  assert.equal(rejected.valid, false)
  assert.ok(rejected.issues.includes("direct_maria_attribution"))
  assert.ok(rejected.issues.includes("removed_public_term:Inner Council"))
  assert.ok(rejected.issues.includes("removed_public_term:Clear Mirror"))
  assert.equal(historical.valid, true)
})

test("doctrine trace metadata is versioned and revisions require Maria approval evidence", () => {
  assert.deepEqual(buildDoctrineTraceMetadata({ traceType: "reflection" }), {
    doctrineVersion: "supraconscious-doctrine-v1",
    guidePersona: "constant",
    frameworkName: "The Seven Dimensions of the Supraconscious",
    traceType: "reflection",
  })
  assert.throws(
    () =>
      authorizeDoctrineRevision("supraconscious-doctrine-v2", {
        approvedBy: "Maria",
        approvedAt: "not-a-date",
        reason: "",
      }),
    /invalid_doctrine_revision_approval/,
  )
  assert.equal(
    authorizeDoctrineRevision("supraconscious-doctrine-v2", {
      approvedBy: "Maria",
      approvedAt: "2026-07-30",
      reason: "Founder-approved contract revision.",
    }).proposedVersion,
    "supraconscious-doctrine-v2",
  )
})

test("Guide voice contract remains constant across dimensions and user progression", () => {
  assert.equal(GUIDE_VOICE_CONTRACT_VERSION, "supraconscious-guide-voice-v1")
  assert.equal(GUIDE_VOICE_CONTRACT.name, "Supraconscious Guide")
  assert.equal(GUIDE_VOICE_CONTRACT.persona, "constant")
  assert.equal(GUIDE_VOICE_CONTRACT.progressionOwner, "user")
  assert.equal(GUIDE_VOICE_CONTRACT.performancePillar.lens, "life_as_performance")
  assert.equal(GUIDE_VOICE_CONTRACT.highRiskOverride, "plain_grounding_before_style")
  assert.match(GUIDE_VOICE_SYSTEM_PROMPT, /constant across every session, dimension, and point/i)
  assert.match(GUIDE_VOICE_SYSTEM_PROMPT, /more authentic choice/i)
  assert.doesNotMatch(GUIDE_VOICE_SYSTEM_PROMPT, /currentLevel|levelName|persona stage/i)
})

test("Guide voice validation rejects authority, certainty, diagnosis, and lost agency", () => {
  const safe = validateGuideVoiceText(
    "You may be noticing a familiar role. If it feels useful, you could try a more truthful response.",
  )
  assert.equal(safe.valid, true)

  const prohibited = validateGuideVoiceText(
    "Maria teaches that I know your truth. You have depression, so you must follow the only answer.",
  )
  assert.equal(prohibited.valid, false)
  assert.deepEqual(prohibited.issues, [
    "direct_founder_attribution",
    "hidden_knowledge_or_certainty_claim",
    "diagnostic_claim",
    "agency_violation",
  ])
})

test("generated-output validation rejects paraphrased founder authority and legacy language", () => {
  const prohibitedOutputs = [
    "As Maria explains, this role is the source of your fear.",
    "This guidance is drawn from Maria's wisdom.",
    "The founder's guidance reveals what you should choose.",
    "On behalf of Maria, I can tell you what this means.",
    "Your Inner Council has reached the Clear Mirror stage.",
  ]

  for (const output of prohibitedOutputs) {
    const guideResult = validateGuideVoiceText(output)
    const publicCopyResult = validatePublicCopyAgainstDoctrine(output)
    assert.equal(guideResult.valid, false, output)
    assert.equal(publicCopyResult.valid, false, output)
  }

  assert.ok(validateGuideVoiceText(prohibitedOutputs[0]!).issues.includes("direct_founder_attribution"))
  assert.ok(validateGuideVoiceText(prohibitedOutputs[4]!).issues.includes("removed_public_term:Inner Council"))
  assert.ok(validateGuideVoiceText(prohibitedOutputs[4]!).issues.includes("removed_public_term:Clear Mirror"))
})

test("Guide voice references stay unset until versioned founder approval is recorded", () => {
  assert.equal(GUIDE_VOICE_CONTRACT.voiceReference.approvalState, "awaiting_founder_samples")
  assert.throws(
    () =>
      authorizeGuideVoiceReference({
        version: "draft",
        approvedBy: "Maria",
        approvedAt: "not-a-date",
        samples: [],
        reason: "",
      }),
    /invalid_guide_voice_reference_approval/,
  )

  const approved = authorizeGuideVoiceReference({
    version: "founder-voice-reference-v1",
    approvedBy: "Maria",
    approvedAt: "2026-07-31T12:00:00.000Z",
    samples: ["A founder-approved voice sample."],
    reason: "Founder supplied the first approved voice reference.",
  })
  assert.equal(approved.approvalState, "founder_approved")
  assert.equal(approved.version, "founder-voice-reference-v1")
  assert.deepEqual(buildGuideVoiceTraceMetadata({ traceType: "reflection" }), {
    guideVoiceVersion: "supraconscious-guide-voice-v1",
    guidePersona: "constant",
    voiceReferenceVersion: "founder-voice-reference-unset",
    traceType: "reflection",
  })
})

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

test("high-risk generation bypasses Guide style for plain grounding", async () => {
  const avatar = await generateAvatarResponse("A high-risk entry.", analysis, highSafety, {
    tone: "direct",
    intensity: 5,
  })
  const prompt = await generateSymbolicPrompt(analysis, highSafety)
  const combined = [...Object.values(avatar), ...Object.values(prompt)].join(" ")

  assert.equal(avatar.patternName, "Grounding")
  assert.equal(avatar.contradiction, "")
  assert.equal(prompt.level, 1)
  assert.equal(prompt.targetPattern, "Grounding")
  assert.match(combined, /support|emergency|crisis/i)
  assert.doesNotMatch(combined, /performance|persona|dimension|future self|visuali[sz]e/i)
})

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

test("local council fallback can respond in the requested language", () => {
  const run = buildLocalCouncilRun("Sigo esperando claridad antes de elegir.", analysis, "es")

  assert.match(run.messages[0].content, /protectora|protector/i)
  assert.match(run.synthesis.integratorQuestion, /Qué|que/i)
})

test("grounding fallback can respond in the requested language", () => {
  const run = buildGroundingCouncilRun("Ich brauche Hilfe.", highSafety, "de")

  assert.equal(run.synthesis.openingLine, "Halte hier inne.")
  assert.match(run.synthesis.integrationStep, /fünf Dinge|fünf/i)
})

test("language instruction preserves structured JSON while setting response language", () => {
  const instruction = languageInstruction("fr")

  assert.match(instruction, /French/)
  assert.match(instruction, /JSON keys/)
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

test("council reflection stores journal text while returning only entry id", () => {
  const args = buildJournalEntryCreateArgs("user-1", "private journal text", "text")

  assert.deepEqual(args, {
    data: {
      userId: "user-1",
      rawText: "private journal text",
      inputMode: "text",
    },
    select: { id: true },
  })
})

test("approved source filter never retrieves unapproved chunks", () => {
  const where = buildApprovedSourceWhere("supraconscious genius pattern")
  assert.deepEqual(where.reviewState, { in: ["approved", "approved_curriculum"] })
  assert.deepEqual(where.sourceDocument.reviewState, { in: ["approved", "approved_curriculum"] })
  assert.deepEqual(where.sourceDocument.rightsStatus, { in: ["approved", "paraphrase_only"] })
  assert.equal(where.safetyIntensity.not, "blocked")
})

test("source rights helper rejects unusable grants", () => {
  const now = new Date("2026-07-04T12:00:00.000Z")

  assert.equal(hasUsableSourceRightsGrant({
    rightsGrants: [{
      status: "paraphrase_only",
      allowedUses: ["internal_retrieval", "paraphrase_generation"],
      quoteAllowed: false,
      expiresAt: null,
      revokedAt: null,
    }],
  }, "paraphrase_generation", { now }), true)

  assert.equal(hasUsableSourceRightsGrant({
    rightsGrants: [{
      status: "paraphrase_only",
      allowedUses: ["internal_retrieval"],
      quoteAllowed: false,
      expiresAt: null,
      revokedAt: null,
    }],
  }, "paraphrase_generation", { now }), false)

  assert.equal(hasUsableSourceRightsGrant({
    rightsGrants: [{
      status: "paraphrase_only",
      allowedUses: ["paraphrase_generation"],
      quoteAllowed: false,
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
      revokedAt: null,
    }],
  }, "paraphrase_generation", { now }), false)
})

test("source provenance copy distinguishes disabled retrieval from no eligible source", () => {
  assert.match(buildSourceProvenanceMessage("rag"), /used approved source material/)
  assert.match(buildSourceProvenanceMessage("no_eligible_source"), /No approved source material matched/)
  assert.match(buildSourceProvenanceMessage("none"), /No source retrieval was used/)
  assert.match(buildSourceProvenanceMessage("grounding"), /grounding and safety guidance/)
})

test("reasoning graph builder creates weighted source-backed concept edges", () => {
  const graph = buildReasoningGraphFromChunks([
    {
      id: "chunk-1",
      sourceDocumentId: "doc-1",
      title: "Maria notes",
      text: "Embodiment practice connects purpose and creative responsibility. Purpose requires embodied choice.",
      conceptTags: ["embodiment practice", "purpose"],
    },
    {
      id: "chunk-2",
      sourceDocumentId: "doc-1",
      title: "Maria notes",
      text: "Embodiment practice turns purpose into grounded action for stakeholders.",
      conceptTags: ["embodiment practice", "purpose"],
    },
  ], { maxNodes: 20, conceptsPerChunk: 6 })

  const purpose = graph.nodes.find((node) => node.key === "purpose")
  const embodiment = graph.nodes.find((node) => node.key === "embodiment-practice")
  assert.ok(purpose)
  assert.ok(embodiment)
  assert.ok(purpose.sourceChunkIds.includes("chunk-1"))
  assert.ok(purpose.sourceChunkIds.includes("chunk-2"))

  const edge = graph.edges.find((item) => item.key === "embodiment-practice__purpose")
  assert.ok(edge)
  assert.equal(edge.weight, 2)
  assert.deepEqual(edge.sourceChunkIds.sort(), ["chunk-1", "chunk-2"])
  assert.ok(graph.clusters.length >= 1)
  assert.ok(graph.insights.some((insight) => insight.sourceChunkIds.length > 0))
})

test("reasoning graph builder excludes founder names and noisy artifact labels", () => {
  assert.equal(isReasoningGraphConceptAllowed("Carl"), false)
  assert.equal(isReasoningGraphConceptAllowed("maria@example.com"), false)
  assert.equal(isReasoningGraphConceptAllowed("2026-04-04t16 Input Want"), false)
  assert.equal(isReasoningGraphConceptAllowed("Embodiment Practice"), true)

  const graph = buildReasoningGraphFromChunks([
    {
      id: "chunk-1",
      sourceDocumentId: "doc-1",
      title: "Product example",
      text: "Carl studies embodiment practice. Embodiment practice connects purpose and grounded action.",
      conceptTags: ["Carl", "embodiment practice", "2026-04-04t16 Input Want", "purpose"],
    },
    {
      id: "chunk-2",
      sourceDocumentId: "doc-1",
      title: "Product example",
      text: "Maria reviews embodiment practice and purpose without turning names into concepts.",
      conceptTags: ["Maria", "embodiment practice", "purpose", "carl@example.com"],
    },
  ], { maxNodes: 20, conceptsPerChunk: 8 })

  assert.equal(graph.nodes.some((node) => node.key === "carl" || node.key === "maria"), false)
  assert.equal(graph.nodes.some((node) => node.label.includes("2026")), false)
  assert.equal(graph.edges.some((edge) => edge.fromKey === "carl" || edge.toKey === "carl"), false)
  assert.ok(graph.nodes.some((node) => node.key === "embodiment-practice"))
})

test("reasoning graph AI insights must cite known graph evidence", () => {
  const graph = buildReasoningGraphFromChunks([
    {
      id: "chunk-1",
      sourceDocumentId: "doc-1",
      title: "Maria notes",
      text: "Purpose connects embodiment practice with grounded stakeholder outcomes.",
      conceptTags: ["purpose", "embodiment practice"],
    },
  ])

  assert.doesNotThrow(() => validateReasoningGraphAiInsights({
    insights: [{
      insightType: "cluster_summary",
      title: "Purpose and embodiment",
      summary: "The graph links purpose to embodied practice through approved source evidence.",
      confidence: 0.7,
      nodeKeys: ["purpose"],
      edgeKeys: [],
      sourceChunkIds: ["chunk-1"],
    }],
  }, graph))

  assert.throws(() => validateReasoningGraphAiInsights({
    insights: [{
      insightType: "cluster_summary",
      title: "Unsupported",
      summary: "This insight has no valid source evidence.",
      confidence: 0.7,
      nodeKeys: ["purpose"],
      edgeKeys: [],
      sourceChunkIds: ["missing-chunk"],
    }],
  }, graph), /unknown source evidence/i)
})

test("reasoning graph AI insight generation is optional when OpenAI is not configured", async () => {
  const previousKey = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = ""
  const graph = buildReasoningGraphFromChunks([
    {
      id: "chunk-1",
      sourceDocumentId: "doc-1",
      title: "Maria notes",
      text: "Purpose connects embodiment practice with grounded stakeholder outcomes.",
      conceptTags: ["purpose", "embodiment practice"],
    },
  ])

  const result = await generateReasoningGraphAiInsights(graph)
  assert.equal(result.status, "unavailable")
  assert.deepEqual(result.insights, [])
  if (previousKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousKey
  }
})

test("reasoning ontology proposals must cite known graph nodes and evidence", () => {
  const graph = buildReasoningGraphFromChunks([
    {
      id: "chunk-1",
      sourceDocumentId: "doc-1",
      title: "Maria notes",
      text: "Purpose connects embodiment practice with grounded stakeholder outcomes.",
      conceptTags: ["purpose", "embodiment practice"],
    },
  ])

  assert.doesNotThrow(() => validateReasoningOntologyProposal({
    concepts: [{
      nodeKey: "purpose",
      canonicalLabel: "Purpose",
      aliases: ["Calling"],
      description: "A source-backed concept for meaningful direction.",
      sourceChunkIds: ["chunk-1"],
    }],
    relationships: [{
      fromNodeKey: "purpose",
      toNodeKey: "embodiment-practice",
      relationType: "practice_to_outcome",
      rationale: "The source links purpose to embodied practice.",
      confidence: 0.72,
      sourceChunkIds: ["chunk-1"],
    }],
  }, graph))

  assert.throws(() => validateReasoningOntologyProposal({
    relationships: [{
      fromNodeKey: "purpose",
      toNodeKey: "missing-node",
      relationType: "supports",
      rationale: "Unsupported node should fail.",
      confidence: 0.7,
      sourceChunkIds: ["chunk-1"],
    }],
  }, graph), /unknown node/i)

  assert.throws(() => validateReasoningOntologyProposal({
    concepts: [{
      nodeKey: "purpose",
      canonicalLabel: "Purpose",
      aliases: [],
      description: "Unsupported evidence should fail.",
      sourceChunkIds: ["missing-chunk"],
    }],
  }, graph), /unknown source evidence/i)
})

test("approved ontology retrieval is gated off by default", async () => {
  const result = await retrieveApprovedOntologyNeighborhood("purpose and embodiment", { enabled: false })

  assert.equal(result.enabled, false)
  assert.deepEqual(result.concepts, [])
  assert.deepEqual(result.relationships, [])
  assert.deepEqual(result.bridgeQuestions, [])
})

test("reasoning ontology proposal generation is optional when OpenAI is not configured", async () => {
  const previousKey = process.env.OPENAI_API_KEY
  process.env.OPENAI_API_KEY = ""
  const graph = buildReasoningGraphFromChunks([
    {
      id: "chunk-1",
      sourceDocumentId: "doc-1",
      title: "Maria notes",
      text: "Purpose connects embodiment practice with grounded stakeholder outcomes.",
      conceptTags: ["purpose", "embodiment practice"],
    },
  ])

  const result = await generateReasoningOntologyProposal(graph)
  assert.equal(result.status, "unavailable")
  assert.equal(result.proposal, null)
  if (previousKey === undefined) {
    delete process.env.OPENAI_API_KEY
  } else {
    process.env.OPENAI_API_KEY = previousKey
  }
})

test("legacy orchestration flags seed disabled", () => {
  const flags = Object.fromEntries(INNER_COUNCIL_FEATURE_FLAGS.map((flag) => [flag.key, flag.enabled]))
  assert.equal(flags.council_mode, false)
  assert.equal(flags.rag_enabled, false)
  assert.equal(flags.memory_feedback_enabled, false)
  assert.equal(flags.admin_evals_enabled, false)
  assert.equal(flags.ontology_rag_enabled, false)
})

test("guide stage config falls back to five defaults", () => {
  const configs = mergeGuideStageConfigs([])

  assert.equal(configs.length, 5)
  assert.deepEqual(readGuideStageNames(configs), ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"])
  assert.equal(readGuideStageConfig(configs, 99).name, "Inner Author")
  assert.equal(readGuideStageConfig(configs, -4).name, "Echo")
})

test("guide stage config merges active metadata and ignores inactive rows", () => {
  const configs = mergeGuideStageConfigs([
    {
      stage: 2,
      name: "Observer",
      description: "A custom stage description.",
      active: true,
      metadata: {
        trait: "Discernment",
        guideTitle: "A tuned guide,",
        guideTitleEmphasis: "not a generic flow.",
        completedLabel: "Integrated",
      },
    },
    {
      stage: 3,
      name: "Should Not Render",
      description: "Inactive config.",
      active: false,
      metadata: { trait: "Hidden" },
    },
  ])

  assert.equal(readGuideStageConfig(configs, 2).name, "Observer")
  assert.equal(readGuideStageConfig(configs, 2).trait, "Discernment")
  assert.equal(readGuideStageConfig(configs, 2).guideTitle, "A tuned guide,")
  assert.equal(readGuideStageConfig(configs, 2).guideTitleEmphasis, "not a generic flow.")
  assert.equal(readGuideStageConfig(configs, 2).completedLabel, "Integrated")
  assert.equal(readGuideStageConfig(configs, 3).name, DEFAULT_GUIDE_STAGE_CONFIGS[2].name)
})

test("guide stage config resolves localized metadata with English fallback", () => {
  const configs = mergeGuideStageConfigs([
    {
      stage: 2,
      name: "Observer",
      description: "A custom stage description.",
      active: true,
      metadata: {
        trait: "Discernment",
        currentLabel: "Current",
        translations: {
          es: {
            name: "Testigo",
            trait: "Observación",
            guideTitle: "Una presencia interior,",
            currentLabel: "Actual",
          },
        },
      },
    },
  ], "es")

  const stage = readGuideStageConfig(configs, 2)
  assert.equal(stage.name, "Testigo")
  assert.equal(stage.description, "A custom stage description.")
  assert.equal(stage.trait, "Observación")
  assert.equal(stage.guideTitle, "Una presencia interior,")
  assert.equal(stage.guideTitleEmphasis, DEFAULT_GUIDE_STAGE_CONFIGS[1].guideTitleEmphasis)
  assert.equal(stage.currentLabel, "Actual")
})

test("guide stage config does not apply unknown locale translations", () => {
  const configs = mergeGuideStageConfigs([
    {
      stage: 1,
      name: "Echo",
      description: "English description.",
      active: true,
      metadata: {
        translations: {
          it: { name: "Eco" },
          es: { name: "Eco" },
        },
      },
    },
  ], "it")

  assert.equal(readGuideStageConfig(configs, 1).name, "Echo")
})

test("guide stage config falls back per missing or blank metadata field", () => {
  const configs = mergeGuideStageConfigs([
    {
      stage: 1,
      name: "  ",
      description: null,
      active: true,
      metadata: {
        trait: "",
        guideIntro: "A custom guide intro.",
      },
    },
  ])

  const stage = readGuideStageConfig(configs, 1)
  assert.equal(stage.name, "Echo")
  assert.equal(stage.description, DEFAULT_GUIDE_STAGE_CONFIGS[0].description)
  assert.equal(stage.trait, "Listening")
  assert.equal(stage.guideIntro, "A custom guide intro.")
  assert.equal(normalizeGuideStage(3.4), 3)
  assert.equal(normalizeGuideStage(undefined), 1)
})

test("account export payload includes core privacy and billing data", () => {
  const payload = buildAccountExportPayload({
    exportedAt: "2026-07-05T00:00:00.000Z",
    user: {
      id: "user_1",
      email: "founder@example.com",
      name: "Founder",
      avatarTone: "balanced",
      intensityLevel: 3,
      currentLevel: 2,
      avatarStage: 1,
      patternMemoryEnabled: true,
      voiceEnabled: true,
      voiceAutoPlay: true,
      voiceInputDefault: "voice",
      voiceGender: "female",
      voiceStyle: "soft",
      voiceSpeed: 1.25,
    },
    journalEntries: [{ id: "entry_1", rawText: "owned journal text" }],
    patternMemories: [{ id: "pattern_1" }],
    councilSessions: [{ id: "session_1", feedback: [{ feedbackType: "helpful", note: "useful" }] }],
    safetyEvents: [{ id: "safety_1" }],
    consentEvents: [{ id: "consent_1" }],
    pilotEvents: [{ id: "event_1", eventName: "journal_submitted", inputHash: "hash" }],
    subscriptions: [{ id: "sub_1", plan: "pro", status: "active" }],
  })

  assert.equal(payload.profile.email, "founder@example.com")
  assert.equal(payload.profile.patternMemoryEnabled, true)
  assert.equal(payload.profile.voiceEnabled, true)
  assert.equal(payload.profile.voiceAutoPlay, true)
  assert.equal(payload.profile.voiceInputDefault, "voice")
  assert.equal(payload.profile.voiceGender, "female")
  assert.equal(payload.profile.voiceStyle, "soft")
  assert.equal(payload.profile.voiceSpeed, 1.25)
  assert.equal(payload.journalEntries.length, 1)
  assert.equal(payload.councilSessions.length, 1)
  assert.equal(payload.pilotEvents.length, 1)
  assert.equal(payload.subscriptions.length, 1)
})

test("account export payload does not expose auth secrets from wider user records", () => {
  const payload = buildAccountExportPayload({
    exportedAt: "2026-07-05T00:00:00.000Z",
    user: {
      id: "user_1",
      email: "founder@example.com",
      passwordHash: "hashed-password",
      role: "super_admin",
      emailVerified: true,
    } as any,
    journalEntries: [],
    patternMemories: [],
    councilSessions: [],
    safetyEvents: [],
    consentEvents: [],
    pilotEvents: [],
    subscriptions: [],
  })

  const serialized = JSON.stringify(payload)
  assert.equal(serialized.includes("passwordHash"), false)
  assert.equal(serialized.includes("hashed-password"), false)
  assert.equal(serialized.includes("super_admin"), false)
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
  assert.equal(classifySourcePath("ΟRIGINAL MANUSCRIPTS /SUPRA_GUARDIANS (8).pdf").sourceType, "manuscript")
  assert.equal(classifySourcePath("AVATAR IMAGES/echo.png").sourceType, "image")
  assert.equal(classifySourcePath("The Inner Council_.docx").sourceType, "product_doctrine")
  assert.equal(defaultReasoningScopeForSourceType("manuscript"), "maria_materials")
  assert.equal(defaultReasoningScopeForSourceType("product_doctrine"), "product_doctrine")
  assert.equal(defaultReasoningScopeForSourceType("curriculum"), "curriculum")
  assert.equal(defaultReasoningScopeForSourceType("image"), "excluded")
})

test("Obsidian parser imports only explicitly opted-in notes", () => {
  const skipped = parseObsidianMarkdown("# Draft\n\nNot ready.", "Draft.md")
  const imported = parseObsidianMarkdown(`---
inner_avatar_import: true
---

# Ready Note

This note is ready for source review.`, "Ready Note.md")

  assert.equal(skipped.shouldImport, false)
  assert.equal(imported.shouldImport, true)
  assert.equal(imported.title, "Ready Note")
  assert.match(imported.body, /^# Ready Note/)
  assert.equal(imported.body.includes("inner_avatar_import"), false)
})

test("Obsidian parser preserves core metadata and links", () => {
  const note = parseObsidianMarkdown(`---
inner_avatar_import: true
title: Council Doctrine
sourceType: manuscript
reasoningScope: maria_materials
author: Maria Olon Tsaroucha
work: Founder Vault
language: en
tags: [inner-council, source]
aliases:
  - Council Source
---

# Ignored Heading

See [[Shadow Work|shadow work]] and [reference](https://example.com/source).`, "Sources/Council Doctrine.md")

  assert.equal(note.title, "Council Doctrine")
  assert.equal(note.sourceType, "manuscript")
  assert.equal(note.reasoningScope, "maria_materials")
  assert.equal(note.author, "Maria Olon Tsaroucha")
  assert.deepEqual(note.tags, ["inner-council", "source"])
  assert.deepEqual(note.aliases, ["Council Source"])
  assert.deepEqual(note.wikiLinks, ["Shadow Work"])
  assert.deepEqual(note.markdownLinks, ["https://example.com/source"])
})

test("Obsidian parser defaults opted-in notes to product doctrine scope", () => {
  const note = parseObsidianMarkdown(`---
inner_avatar_import: true
---

No explicit source type.`, "Product Thought.md")

  assert.equal(note.sourceType, "product_doctrine")
  assert.equal(note.reasoningScope, "product_doctrine")
})

test("PDF text normalization creates clean review paragraphs", () => {
  assert.deepEqual(
    normalizePdfTextToParagraphs(" First line   wraps\n  into second line\n\n\nNext   paragraph "),
    ["First line wraps into second line", "Next paragraph"],
  )
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

test("council prompt payload includes compact GraphRAG context when enabled", () => {
  const graphRagContext: GraphRagContext = {
    enabled: true,
    concepts: [{
      id: "concept-purpose",
      label: "Purpose",
      description: "Purpose as an embodied direction.",
      aliases: ["calling"],
      pinned: true,
      score: 9.2,
      evidence: [{ sourceChunkId: "chunk-1", excerpt: "Purpose requires practice." }],
      clusterLabels: ["Direction"],
      outcomeLabels: ["Grounded action"],
    }],
    relationships: [{
      id: "rel-1",
      fromConceptId: "concept-purpose",
      toConceptId: "concept-practice",
      fromLabel: "Purpose",
      toLabel: "Practice",
      relationType: "practice_to_outcome",
      rationale: "Purpose becomes visible through practice.",
      confidence: 0.82,
      score: 7.1,
      evidence: [{ sourceChunkId: "chunk-1", excerpt: "Purpose requires practice." }],
    }],
    paths: [{
      conceptIds: ["concept-purpose", "concept-practice"],
      relationshipIds: ["rel-1"],
      labels: ["Purpose", "Practice"],
      relationTypes: ["practice_to_outcome"],
      summary: "Purpose -> practice_to_outcome -> Practice",
      score: 7.1,
      evidenceSourceChunkIds: ["chunk-1"],
    }],
    gaps: [{
      title: "Grounded action",
      summary: "The next action is underconnected.",
      missingAreas: ["measurable next step"],
      supportingConceptIds: ["concept-purpose"],
    }],
    stakeholderPaths: [{
      id: "outcome-1",
      label: "Grounded action",
      summary: "Move insight into action.",
      missingAreas: ["measurable next step"],
      conceptIds: ["concept-purpose"],
      evidenceSourceChunkIds: ["chunk-1"],
    }],
    bridgeQuestions: ["What bridge makes purpose practical?"],
    sourceChunkIds: ["chunk-1"],
    trace: {
      enabled: true,
      status: "selected",
      queryTerms: ["purpose"],
      selectedConceptIds: ["concept-purpose"],
      selectedRelationshipIds: ["rel-1"],
      selectedSourceChunkIds: ["chunk-1"],
      pathSummaries: ["Purpose -> practice_to_outcome -> Practice"],
      latencyMs: 12,
    },
  }

  const payload = buildCouncilPromptInput("I want purpose to become action.", analysis, { ...highSafety, severity: "low", flags: [], allowReflectiveFlow: true }, {
    tone: "warm",
    intensity: 4,
    currentLevel: 1,
    avatarStage: 1,
    sourceContext: [{ id: "chunk-1", title: "Maria notes", text: "Purpose requires practice." }],
    graphRagContext,
  }, "en")

  assert.equal(payload.graphRagContext?.concepts[0]?.label, "Purpose")
  assert.equal(payload.graphRagContext?.relationships[0]?.relationType, "practice_to_outcome")
  assert.deepEqual(payload.graphRagContext?.paths[0]?.evidenceSourceChunkIds, ["chunk-1"])
})

test("council prompt payload omits disabled GraphRAG context", () => {
  const payload = buildCouncilPromptInput("I want purpose to become action.", analysis, { ...highSafety, severity: "low", flags: [], allowReflectiveFlow: true }, {
    tone: "warm",
    intensity: 4,
    currentLevel: 1,
    avatarStage: 1,
    graphRagContext: {
      enabled: false,
      concepts: [],
      relationships: [],
      paths: [],
      gaps: [],
      stakeholderPaths: [],
      bridgeQuestions: [],
      sourceChunkIds: [],
      trace: {
        enabled: false,
        status: "disabled",
        queryTerms: [],
        selectedConceptIds: [],
        selectedRelationshipIds: [],
        selectedSourceChunkIds: [],
        pathSummaries: [],
      },
    },
  }, "en")

  assert.equal(payload.graphRagContext, null)
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
    content: "private",
    feedbackNote: "private",
    input_text: "private",
    rawText: "private",
    journalText: "private",
    message: "private",
    note: "private",
    text: "private",
    hasNote: true,
    entryCount: 3,
    sourceMode: "rag",
  })
  assert.deepEqual(sanitized, { hasNote: true, entryCount: 3, sourceMode: "rag" })
})

test("pilot event input hash accepts precomputed hashes without raw text", () => {
  assert.equal(resolvePilotEventInputHash({ inputHash: "precomputed", inputText: null }), "precomputed")
  assert.equal(resolvePilotEventInputHash({ inputHash: null, inputText: "private journal text" })?.length, 64)
  assert.equal(resolvePilotEventInputHash({ inputHash: null, inputText: null }), null)
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
      councilModeEnabled: false,
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
        qualityReviews: [{
          label: "grounded",
          severity: "normal",
          reason: "Reviewed with private detail about the session.",
          metadata: { feedbackDisposition: "reviewed" },
        }],
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
  assert.equal(report.ragLearningQueue.some((item) => item.hasLatestReviewReason), true)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
  assert.equal(JSON.stringify(report).includes("private detail"), false)
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
      hasLatestReviewReason: false,
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

test("pilot expansion audit email hash is stable and non-identifying", () => {
  const hash = hashEmailForAudit(" Pilot+Founder@Example.com ")

  assert.equal(hash, hashEmailForAudit("pilot+founder@example.com"))
  assert.equal(hash.includes("pilot"), false)
  assert.equal(hash.includes("example"), false)
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
          hasLatestReviewReason: false,
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
          hasLatestReviewReason: false,
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
          hasLatestReviewReason: false,
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
          { feedbackType: "unsupported_source", note: "The source felt off with private detail." },
          { feedbackType: "not_accurate", note: null },
        ],
        qualityReviews: [
          {
            label: "source_unsupported",
            severity: "normal",
            reason: "Selected source did not support the private detail claim.",
            metadata: { calibrationIssueType: "source_issue" },
          },
          {
            label: "voice_wrong",
            severity: "normal",
            reason: "Voice was too generic about the private detail.",
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
  assert.equal(JSON.stringify(report).includes("private detail"), false)
  assert.equal(report.sourceGroundingIssues.some((issue) => issue.hasReviewReason), true)
  assert.equal(report.promptIssues.some((issue) => issue.hasReviewReason), true)
})

test("founder calibration feedback notes require detail beyond templates", () => {
  assert.equal(isFounderCalibrationFeedbackNoteUseful("Voice mismatch: "), false)
  assert.equal(isFounderCalibrationFeedbackNoteUseful("Too generic:"), false)
  assert.equal(isFounderCalibrationFeedbackNoteUseful("Good enough: felt clear and grounded"), true)
  assert.equal(isFounderCalibrationFeedbackNoteUseful("This felt like Maria's voice."), true)
})

test("founder calibration scenario can be inferred from guided prompt text", () => {
  assert.equal(
    inferFounderCalibrationScenarioFromText(
      "Some real context.\n\nI want to test whether this reflection sounds grounded in Maria's work without pretending to be Maria. Reflect on a decision where I feel split between protection and truth.",
    ),
    "voice_test",
  )
  assert.equal(inferFounderCalibrationScenarioFromText("A completely custom reflection."), "freeform")
})

test("founder calibration report infers missing scenario metadata from journal text without serializing it", () => {
  const report = buildFounderCalibrationReportFromSnapshot({
    checkedAt: new Date("2026-07-03T12:00:00.000Z"),
    sessions: [
      {
        id: "session_text_inferred",
        userId: "user_carl",
        userEmail: "carl@example.com",
        userName: "Carl",
        sourceMode: "rag",
        journalText: "private journal text. I understand the insight, but I need one small embodied shift I can actually live today. Help me find the next grounded action.",
        feedback: [{ feedbackType: "helpful", note: null }],
        qualityReviews: [],
        generationTraces: [{ traceType: "council", validationStatus: "validated", promptVersion: "council.system@v1", sourceChunkId: null, sourceTitle: null, outputJson: {} }],
      },
    ],
  })

  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "embodiment_test")?.totalSessions, 1)
  assert.equal(report.scenarioCoverage.some((item) => item.scenario === "freeform"), false)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
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
      {
        id: "resolved_source",
        sourceMode: "rag",
        feedbackTypes: ["unsupported_source"],
        qualityReviews: [{ label: "ready", severity: "normal", metadata: { goldenExample: true } }],
        generationTraces: [{
          traceType: "council",
          promptVersion: "council.system@v4",
          outputJson: { calibration: { scenario: "source_grounding_test" } },
        }],
      },
    ],
  })

  assert.equal(readFounderCalibrationScenario("unknown"), "freeform")
  assert.equal(report.goldenExamples.length, 2)
  assert.equal(report.unresolvedIssues.length, 1)
  assert.equal(report.unresolvedIssues.some((item) => item.councilSessionId === "resolved_source"), false)
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "voice_test")?.goldenExamples, 1)
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "source_grounding_test")?.goldenExamples, 1)
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

test("founder calibration user check uses targeted DB lookup before fallback", async () => {
  let countCalls = 0
  const matchingClient = {
    founderCalibrationParticipant: {
      findFirst: async () => ({ id: "participant_carl" }),
      count: async () => {
        countCalls += 1
        return 1
      },
    },
  }
  assert.equal(await isFounderCalibrationUser("Carl@Example.com", matchingClient), true)
  assert.equal(countCalls, 0)

  const configuredClient = {
    founderCalibrationParticipant: {
      findFirst: async () => null,
      count: async () => 2,
    },
  }
  assert.equal(await isFounderCalibrationUser("other@example.com", configuredClient), false)

  const pausedOnlyClient = {
    founderCalibrationParticipant: {
      findFirst: async () => null,
      count: async () => 1,
    },
  }
  assert.equal(await isFounderCalibrationUser("paused@example.com", pausedOnlyClient), false)

  const emptyClient = {
    founderCalibrationParticipant: {
      findFirst: async () => null,
      count: async () => 0,
    },
  }
  assert.equal(await isFounderCalibrationUser("other@example.com", emptyClient), true)
  assert.equal(await isFounderCalibrationUser("demo@inner-avatar.ai", emptyClient), false)
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
          feedback: [],
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
  assert.equal(carl?.nextAction, "First session captured. Next useful pass: Source-grounding test.")
  assert.equal(carl?.scenarioStatus.find((item) => item.scenario === "voice_test")?.completed, true)
  assert.equal(carl?.scenarioStatus.find((item) => item.scenario === "voice_test")?.hasReadyExample, true)
  const maria = report.participants.find((participant) => participant.email === "maria@example.com")
  assert.equal(maria?.nextAction, "maria@example.com needs to register.")
  assert.equal(maria?.nextActionHref, "/register")
  assert.equal(maria?.scenarioStatus.some((item) => item.scenario === "freeform"), false)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
  assert.equal(JSON.stringify(report).includes("raw note"), false)
})

test("founder setup treats freeform founder sessions as captured first-session progress", () => {
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
          feedback: [],
          qualityReviews: [],
          generationTraces: [{ traceType: "council", outputJson: {} }],
        }],
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

  const carl = report.participants.find((participant) => participant.email === "carl@example.com")
  assert.equal(carl?.sessionCount, 1)
  assert.equal(carl?.nextAction, "carl@example.com needs one calibration feedback type on the saved session.")
  assert.equal(carl?.nextActionHref, "/journal/entry_carl")
  assert.ok(carl?.missingActions.some((action) => action.code === "feedback_missing" && action.href === "/journal/entry_carl"))
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "freeform")?.totalSessions, 1)
  assert.equal(report.blockers.some((blocker) => blocker.includes("carl@example.com needs one calibration feedback type")), true)
})

test("founder setup infers scenario status from guided prompt journal text", () => {
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
          journalText: "private journal text. Use the Inner Council idea as background if there is approved source material for it. I want to see whether the guidance names the source clearly without overclaiming.",
          createdAt: new Date("2026-07-03T12:00:00.000Z"),
          feedback: [{ hasNote: false }],
          qualityReviews: [],
          generationTraces: [{ traceType: "council", outputJson: {} }],
        }],
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
        sessions: [],
      },
    ],
  })

  const carl = report.participants.find((participant) => participant.email === "carl@example.com")
  assert.equal(carl?.scenarioStatus.find((item) => item.scenario === "source_grounding_test")?.completed, true)
  assert.equal(report.scenarioCoverage.find((item) => item.scenario === "source_grounding_test")?.totalSessions, 1)
  assert.equal(JSON.stringify(report).includes("private journal text"), false)
})

test("founder journal readiness preserves first-session and feedback prompts", () => {
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
        onboardingComplete: true,
        consentCount: 5,
        sessions: [{
          id: "session_carl",
          journalEntryId: "entry_carl",
          createdAt: new Date("2026-07-03T12:00:00.000Z"),
          feedback: [{ hasNote: false }],
          qualityReviews: [],
          generationTraces: [{ traceType: "council", outputJson: { calibration: { scenario: "voice_test" } } }],
        }],
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
        sessions: [],
      },
    ],
  })

  const carl = setupReport.participants.find((participant) => participant.email === "carl@example.com") ?? null
  const maria = setupReport.participants.find((participant) => participant.email === "maria@example.com") ?? null

  assert.deepEqual(buildFounderCalibrationJournalReadiness({ founderCalibrationMode: false, participant: carl }), {
    founderCalibrationMode: false,
    suggestedCalibrationScenario: null,
    needsFounderFirstSessionGuide: false,
    needsFounderFeedback: false,
    founderFeedbackHref: null,
    sessionCount: 0,
    feedbackEvidenceCount: 0,
    feedbackNoteCount: 0,
    reviewedSessionCount: 0,
    goldenExampleCount: 0,
  })
  assert.deepEqual(buildFounderCalibrationJournalReadiness({ founderCalibrationMode: true, participant: carl }), {
    founderCalibrationMode: true,
    suggestedCalibrationScenario: "source_grounding_test",
    needsFounderFirstSessionGuide: false,
    needsFounderFeedback: false,
    founderFeedbackHref: "/journal/entry_carl",
    sessionCount: 1,
    feedbackEvidenceCount: 1,
    feedbackNoteCount: 0,
    reviewedSessionCount: 0,
    goldenExampleCount: 0,
  })
  assert.deepEqual(buildFounderCalibrationJournalReadiness({ founderCalibrationMode: true, participant: maria }), {
    founderCalibrationMode: true,
    suggestedCalibrationScenario: "voice_test",
    needsFounderFirstSessionGuide: true,
    needsFounderFeedback: false,
    founderFeedbackHref: null,
    sessionCount: 0,
    feedbackEvidenceCount: 0,
    feedbackNoteCount: 0,
    reviewedSessionCount: 0,
    goldenExampleCount: 0,
  })
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
          feedback: [],
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
  assert.match(report.requiredRoles.maria.handoffText, /Choose one feedback type on the saved session/)
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
          feedback: [],
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

  assert.equal(carl?.primaryHref, "https://web.example/login?email=carl%40example.com&next=%2Fonboarding%3Fnext%3D%252Fjournal")
  assert.match(carl?.handoffText ?? "", /https:\/\/web\.example\/login\?email=carl%40example\.com&next=%2Fonboarding%3Fnext%3D%252Fjournal/)
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

test("founder participant audit metadata hashes emails", () => {
  const metadata = buildFounderParticipantAuditMetadata({
    email: " Carl@Example.com ",
    participantRole: "carl",
    linkedUser: true,
    status: "active",
    source: "test",
  })

  assert.equal(metadata.emailHash, hashFounderParticipantEmailForAudit("carl@example.com"))
  assert.equal(metadata.participantRole, "carl")
  assert.equal(metadata.linkedUser, true)
  assert.equal(metadata.status, "active")
  assert.equal(metadata.source, "test")
  assert.equal(JSON.stringify(metadata).includes("Carl@Example.com"), false)
  assert.equal(JSON.stringify(metadata).includes("carl@example.com"), false)
})

test("langsmith is disabled by default and missing api key does not enable tracing", () => {
  assert.equal(isLangSmithEnabled({} as NodeJS.ProcessEnv), false)
  assert.equal(isLangSmithEnabled({ LANGSMITH_TRACING: "true" } as NodeJS.ProcessEnv), false)
  assert.equal(isLangSmithEnabled({ LANGSMITH_TRACING: "false", LANGSMITH_API_KEY: "test-langsmith-key" } as NodeJS.ProcessEnv), false)
  assert.equal(isLangSmithEnabled({ LANGSMITH_TRACING: "true", LANGSMITH_API_KEY: "test-langsmith-key" } as NodeJS.ProcessEnv), true)
})

test("langsmith sanitizer removes raw content and preserves safe trace metadata", () => {
  const sanitized = sanitizeLangSmithMetadata({
    requestId: "request_1",
    userId: "user_1",
    journalEntryId: "entry_1",
    inputHash: "hash_1",
    inputText: "private journal text",
    rawText: "private raw text",
    feedbackNote: "private feedback note",
    promptTemplate: { key: "council.system", version: 2, content: "private prompt" },
    councilRun: { messages: [{ content: "private council output" }] },
    retrieved: [{ id: "chunk_1", title: "Inner Council", chunkText: "private source chunk", displayExcerpt: "private quote" }],
    model: "gpt-5-mini",
    promptVersion: "council.system@v2",
    validationStatus: "validated",
  }).metadata

  const serialized = JSON.stringify(sanitized)
  assert.equal(serialized.includes("private journal text"), false)
  assert.equal(serialized.includes("private raw text"), false)
  assert.equal(serialized.includes("private feedback note"), false)
  assert.equal(serialized.includes("private prompt"), false)
  assert.equal(serialized.includes("private council output"), false)
  assert.equal(serialized.includes("private source chunk"), false)
  assert.equal(serialized.includes("private quote"), false)
  assert.equal(sanitized.requestId, "request_1")
  assert.equal(sanitized.userId, "user_1")
  assert.equal(sanitized.journalEntryId, "entry_1")
  assert.equal(sanitized.inputHash, "hash_1")
  assert.equal(sanitized.model, "gpt-5-mini")
  assert.equal(sanitized.promptVersion, "council.system@v2")
  assert.equal(sanitized.validationStatus, "validated")
})

test("langsmith run wrapper returns mocked trace metadata without blocking success", async () => {
  const previous = {
    LANGSMITH_TRACING: process.env.LANGSMITH_TRACING,
    LANGSMITH_API_KEY: process.env.LANGSMITH_API_KEY,
    LANGSMITH_PROJECT: process.env.LANGSMITH_PROJECT,
    LANGSMITH_SAMPLE_RATE: process.env.LANGSMITH_SAMPLE_RATE,
  }
  const creates: Array<Record<string, unknown>> = []
  const updates: Array<{ runId: string; run: Record<string, unknown> }> = []
  setLangSmithClientFactoryForTests(async () => ({
    createRun: async (run) => { creates.push(run) },
    updateRun: async (runId, run) => { updates.push({ runId, run }) },
  }))
  process.env.LANGSMITH_TRACING = "true"
  process.env.LANGSMITH_API_KEY = "test-langsmith-key"
  process.env.LANGSMITH_PROJECT = "inner-avatar-test"
  process.env.LANGSMITH_SAMPLE_RATE = "1"

  try {
    const result = await withLangSmithRun("test.run", {
      requestId: "request_1",
      rawText: "private raw text",
      promptVersion: "council.system@v1",
    }, async (context) => ({
      ok: true,
      langsmith: buildGenerationTraceLangSmithMetadata(context, { step: "council", validationStatus: "validated" }),
    }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    assert.equal(result.value.ok, true)
    assert.equal(result.langsmith.enabled, true)
    assert.equal(result.langsmith.sampled, true)
    assert.equal(result.langsmith.projectName, "inner-avatar-test")
    assert.ok(result.langsmith.runId)
    assert.equal(result.value.langsmith.runId, result.langsmith.runId)
    assert.equal(result.value.langsmith.guideVoiceVersion, "supraconscious-guide-voice-v1")
    assert.equal(result.value.langsmith.voiceReferenceVersion, "founder-voice-reference-unset")
    assert.equal(result.value.langsmith.validationStatus, "validated")
    assert.equal(creates.length, 1)
    assert.equal(updates.length >= 1, true)
    assert.equal(JSON.stringify(creates[0]).includes("private raw text"), false)
  } finally {
    process.env.LANGSMITH_TRACING = previous.LANGSMITH_TRACING
    process.env.LANGSMITH_API_KEY = previous.LANGSMITH_API_KEY
    process.env.LANGSMITH_PROJECT = previous.LANGSMITH_PROJECT
    process.env.LANGSMITH_SAMPLE_RATE = previous.LANGSMITH_SAMPLE_RATE
    resetLangSmithClientFactoryForTests()
  }
})

test("langsmith observability check passes without external service", async () => {
  const report = await runLangSmithObservabilityCheck()
  assert.equal(report.passed, true)
  assert.equal(report.checks.disabledNoop, true)
  assert.equal(report.checks.redactionPassed, true)
  assert.equal(report.checks.safeMetadataPreserved, true)
})
