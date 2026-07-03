import assert from "node:assert/strict"
import test from "node:test"
import {
  buildApprovedSourceWhere,
  classifySourcePath,
  buildGroundingCouncilRun,
  buildLocalCouncilRun,
  enforceCouncilShape,
  INNER_COUNCIL_FEATURE_FLAGS,
  parseCurriculumDaysFromParagraphs,
  SOURCE_POLICY_VERSION,
  shouldWritePatternMemory,
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
