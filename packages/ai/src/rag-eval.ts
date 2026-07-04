import {
  canDisplaySourceQuote,
  evaluateSourceEligibility,
  type SourcePolicyDocument,
  type SourcePolicyChunk,
} from "./source-policy.js"
import { scoreSourceChunkForQuery } from "./source-context.js"
import { buildLocalCouncilRun, validateCouncilSourceCitations } from "./generate-council-run.js"
import type { EntryAnalysis } from "./schemas.js"

export type RagEvalCase = {
  name: string
  passed: boolean
  details?: string
}

export type RagEvalReport = {
  passed: boolean
  total: number
  failed: number
  cases: RagEvalCase[]
}

const now = new Date("2026-07-03T12:00:00.000Z")
const approvedDocument: SourcePolicyDocument = {
  reviewState: "approved",
  rightsStatus: "paraphrase_only",
  rightsGrants: [
    {
      status: "paraphrase_only",
      allowedUses: ["internal_retrieval", "paraphrase_generation"],
      quoteAllowed: false,
      expiresAt: null,
      revokedAt: null,
    },
  ],
}
const approvedChunk: SourcePolicyChunk = {
  reviewState: "approved",
  quotePermission: "paraphrase_only",
  safetyIntensity: "normal",
}

export function runKeywordRagEvals(): RagEvalReport {
  const cases: RagEvalCase[] = [
    evalCase("approved match retrieves", () => evaluateSourceEligibility(approvedDocument, approvedChunk, { now }).eligible),
    evalCase("blocked chunk does not retrieve", () => !evaluateSourceEligibility(approvedDocument, { ...approvedChunk, reviewState: "blocked" }, { now }).eligible),
    evalCase("deprecated document does not retrieve", () => !evaluateSourceEligibility({ ...approvedDocument, reviewState: "deprecated" }, approvedChunk, { now }).eligible),
    evalCase("missing rights does not retrieve", () => !evaluateSourceEligibility({ ...approvedDocument, rightsGrants: [] }, approvedChunk, { now }).eligible),
    evalCase("revoked grant does not retrieve", () => !evaluateSourceEligibility({
      ...approvedDocument,
      rightsGrants: [{ ...approvedDocument.rightsGrants![0]!, revokedAt: now }],
    }, approvedChunk, { now }).eligible),
    evalCase("expired grant does not retrieve", () => !evaluateSourceEligibility({
      ...approvedDocument,
      rightsGrants: [{ ...approvedDocument.rightsGrants![0]!, expiresAt: new Date("2026-01-01T00:00:00.000Z") }],
    }, approvedChunk, { now }).eligible),
    evalCase("quote display requires direct quote grant", () => !canDisplaySourceQuote(approvedDocument, { ...approvedChunk, quotePermission: "quote_safe" }, { now })),
    evalCase("high-risk safety bypasses retrieval", () => !evaluateSourceEligibility(approvedDocument, approvedChunk, { now, safetySeverity: "high" }).eligible),
    evalCase("medium-risk safety excludes sensitive chunks", () => !evaluateSourceEligibility(approvedDocument, { ...approvedChunk, safetyIntensity: "sensitive" }, { now, safetySeverity: "medium" }).eligible),
    evalCase("keyword scoring is deterministic", () => {
      const left = scoreSourceChunkForQuery({
        chunkText: "The Inner Council notices choice, protector energy, and embodied micro-shifts.",
        quoteSafeExcerpt: "choice and protector energy",
        conceptTags: ["inner_council"],
        councilRoleTags: ["protector"],
        sourcePriority: 3,
      }, ["choice", "protector"])
      const right = scoreSourceChunkForQuery({
        chunkText: "The Inner Council notices choice, protector energy, and embodied micro-shifts.",
        quoteSafeExcerpt: "choice and protector energy",
        conceptTags: ["inner_council"],
        councilRoleTags: ["protector"],
        sourcePriority: 3,
      }, ["choice", "protector"])
      return left.score === right.score &&
        left.matchedTerms.join(",") === "choice,protector" &&
        left.matchedFields.includes("chunkText")
    }),
    evalCase("citation filtering limits source ids", () => {
      const run = buildLocalCouncilRun("I need choice.", analysis)
      const validated = validateCouncilSourceCitations({
        ...run,
        messages: run.messages.map((message) => ({
          ...message,
          content: "Maria says this pattern needs attention.",
          sourceChunkIds: ["allowed", "blocked"],
        })),
        synthesis: {
          ...run.synthesis,
          sourceChunkIds: ["allowed", "blocked"],
        },
      }, [{ id: "allowed" }])
      return validated.messages.every((message) => message.sourceChunkIds.every((id) => id === "allowed")) &&
        !validated.messages[0]?.content.includes("Maria says")
    }),
  ]

  const failed = cases.filter((item) => !item.passed).length
  return {
    passed: failed === 0,
    total: cases.length,
    failed,
    cases,
  }
}

function evalCase(name: string, run: () => boolean): RagEvalCase {
  try {
    return { name, passed: run() }
  } catch (error) {
    return {
      name,
      passed: false,
      details: error instanceof Error ? error.message : "Unknown eval error",
    }
  }
}

const analysis: EntryAnalysis = {
  emotionalSignals: { primary: ["uncertain"], secondary: [], intensity: 3 },
  languageMarkers: {
    repeatedWords: [],
    absolutes: [],
    passiveVoiceExamples: [],
    ownershipLanguageExamples: [],
  },
  behavioralPatterns: [{ label: "Delay", confidence: 0.7, evidence: ["I wait."] }],
  contradictionSignals: [],
  avoidanceSignals: [],
  suggestedLevel: 2,
  safetyFlags: { severity: "low", flags: [] },
  summary: "A choice is waiting for attention.",
}
