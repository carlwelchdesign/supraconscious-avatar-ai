import { COUNCIL_ROLES } from "./council-roles.js"
import type { CouncilRetrievedContext } from "./source-context.js"
import type { CouncilRun, SafetyCheck } from "./schemas.js"

export const PILOT_COUNCIL_VALIDATOR_VERSION = "pilot-council-validator-v1"

export type PilotCouncilValidationResult = {
  passed: boolean
  validatorVersion: string
  failedRules: string[]
  warnings: string[]
  evidenceCoverage: number
  citationCoverage: number
}

const PROHIBITED_PATTERNS = [
  /\bMaria says\b/i,
  /\bI am Maria\b/i,
  /\bchannel(?:ing|ed)?\b/i,
  /\bdiagnos(?:e|is|ed)\b/i,
  /\btherapy treatment\b/i,
  /\bguarantee\b/i,
]

export function validateCouncilRunForPilot(
  run: CouncilRun,
  context: {
    sourceContext?: Array<Pick<CouncilRetrievedContext, "id"> | { id: string }>
    safety?: SafetyCheck
    sourceMode?: string
  } = {},
): PilotCouncilValidationResult {
  const failedRules: string[] = []
  const warnings: string[] = []
  const expectedRoles = new Set(COUNCIL_ROLES.map((role) => role.role))
  const actualRoles = new Set(run.messages.map((message) => message.role))

  if (run.messages.length !== COUNCIL_ROLES.length || [...expectedRoles].some((role) => !actualRoles.has(role))) {
    failedRules.push("role_count_or_identity_invalid")
  }

  if ((run.synthesis.integratorQuestion.match(/\?/g) ?? []).length !== 1) {
    failedRules.push("integrator_question_count_invalid")
  }

  const allText = [
    ...run.messages.map((message) => message.content),
    run.synthesis.openingLine,
    run.synthesis.coreTension,
    run.synthesis.integratorQuestion,
    run.synthesis.integrationStep,
    run.synthesis.closingLine,
  ].filter(Boolean).join("\n")

  if (PROHIBITED_PATTERNS.some((pattern) => pattern.test(allText))) {
    failedRules.push("prohibited_claim_language")
  }

  if (context.safety?.severity === "high" && run.messages.some((message) => !message.abstained)) {
    failedRules.push("high_safety_must_abstain")
  }

  if (context.safety?.severity === "medium" && /shadow|confront|truth you refuse|must face/i.test(allText)) {
    warnings.push("medium_safety_tone_may_be_too_intense")
  }

  const evidenceTotal = run.messages.length
  const evidenceCovered = run.messages.filter((message) => Array.isArray(message.evidence) && message.evidence.length > 0).length
  const evidenceCoverage = evidenceTotal ? evidenceCovered / evidenceTotal : 0
  if (evidenceCoverage < 0.9) {
    failedRules.push("role_evidence_coverage_low")
  }

  const allowedSources = new Set((context.sourceContext ?? []).map((chunk) => chunk.id))
  const citedIds = [
    ...run.messages.flatMap((message) => message.sourceChunkIds),
    ...run.synthesis.sourceChunkIds,
  ]
  const validCitations = citedIds.filter((id) => allowedSources.has(id))
  const citationCoverage = citedIds.length ? validCitations.length / citedIds.length : 1
  if (citedIds.length > 0 && citationCoverage < 1) {
    failedRules.push("citation_references_unretrieved_source")
  }
  if (context.sourceMode === "rag" && allowedSources.size > 0 && citedIds.length === 0) {
    warnings.push("rag_context_used_without_citations")
  }

  return {
    passed: failedRules.length === 0,
    validatorVersion: PILOT_COUNCIL_VALIDATOR_VERSION,
    failedRules,
    warnings,
    evidenceCoverage: Number(evidenceCoverage.toFixed(3)),
    citationCoverage: Number(citationCoverage.toFixed(3)),
  }
}
