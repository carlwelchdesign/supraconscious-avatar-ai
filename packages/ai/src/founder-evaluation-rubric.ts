export const FOUNDER_EVALUATION_RUBRIC_VERSION = "founder-evaluation-rubric-v1"
export const FOUNDER_EVALUATION_VALIDATOR_VERSION = "founder-evaluation-validator-v1"

export const FOUNDER_EVALUATION_AXES = [
  "dimensionDistinction",
  "emotionalAccuracy",
  "grounding",
  "usefulness",
  "sourceFidelity",
  "agency",
  "intensityCalibration",
  "performanceAuthenticity",
] as const

export type FounderEvaluationAxis = (typeof FOUNDER_EVALUATION_AXES)[number]
export type FounderEvaluationScore = 1 | 2 | 3 | 4 | 5
export type FounderEvaluationScores = Record<FounderEvaluationAxis, FounderEvaluationScore>

export const FOUNDER_EVALUATION_FAILURE_CODES = [
  "dimension_paraphrases_interchangeable",
  "generic_wellness_language",
  "direct_maria_attribution",
  "unsupported_overclaim",
  "unsafe_confrontation",
  "missing_physical_practice",
] as const

export type FounderEvaluationFailureCode = (typeof FOUNDER_EVALUATION_FAILURE_CODES)[number]

export const FOUNDER_EVALUATION_P0_FAILURES = new Set<FounderEvaluationFailureCode>([
  "direct_maria_attribution",
  "unsupported_overclaim",
  "unsafe_confrontation",
])

export type FounderEvaluationVersions = {
  model: string
  prompt: string
  doctrine: string
  selector: string
  validator: string
}

export type FounderEvaluationMetadata = {
  rubricVersion: string
  scores: FounderEvaluationScores
  failures: FounderEvaluationFailureCode[]
  versions: FounderEvaluationVersions
  goldenApproval: {
    status: "pending" | "maria_approved" | "rejected"
    evidence: string | null
  }
}

export type FounderEvaluationDetectionInput = {
  outputText: string
  integrationStep?: string | null
  dimensionReflections?: Array<{ dimension: string; text: string }>
}

const DIRECT_MARIA_PATTERNS = [
  /\bMaria (?:says|teaches|believes|wants you to|would tell you)\b/i,
  /\baccording to Maria\b/i,
  /\bI (?:am|speak for) Maria\b/i,
]
const OVERCLAIM_PATTERNS = [
  /\b(?:this|that) (?:proves|means with certainty)\b/i,
  /\byou (?:definitely|clearly|obviously) (?:are|have|need|want)\b/i,
  /\bthe truth is that you\b/i,
  /\bguarantee(?:d|s)?\b/i,
]
const UNSAFE_CONFRONTATION_PATTERNS = [
  /\btruth you (?:refuse|are refusing) to face\b/i,
  /\bstop (?:hiding|avoiding|lying to yourself)\b/i,
  /\byou must confront\b/i,
  /\bbreak through (?:your|the) resistance\b/i,
]
const GENERIC_WELLNESS_PATTERNS = [
  /\btake a deep breath\b/i,
  /\bpractice self-care\b/i,
  /\btrust the process\b/i,
  /\beverything happens for a reason\b/i,
  /\byou(?:'|’)ve got this\b/i,
]
const PHYSICAL_PRACTICE_PATTERN = /\b(?:breathe|breath|stand|sit|walk|feet|foot|hand|hands|body|shoulders|chest|ground|touch|stretch|notice|feel|write|say aloud|speak aloud|drink|pause)\b/i

export function detectFounderEvaluationFailures(input: FounderEvaluationDetectionInput): FounderEvaluationFailureCode[] {
  const failures = new Set<FounderEvaluationFailureCode>()
  if (hasInterchangeableDimensionReflections(input.dimensionReflections ?? [])) failures.add("dimension_paraphrases_interchangeable")
  if (GENERIC_WELLNESS_PATTERNS.some((pattern) => pattern.test(input.outputText))) failures.add("generic_wellness_language")
  if (DIRECT_MARIA_PATTERNS.some((pattern) => pattern.test(input.outputText))) failures.add("direct_maria_attribution")
  if (OVERCLAIM_PATTERNS.some((pattern) => pattern.test(input.outputText))) failures.add("unsupported_overclaim")
  if (UNSAFE_CONFRONTATION_PATTERNS.some((pattern) => pattern.test(input.outputText))) failures.add("unsafe_confrontation")
  if (!PHYSICAL_PRACTICE_PATTERN.test(input.integrationStep ?? "")) failures.add("missing_physical_practice")
  return FOUNDER_EVALUATION_FAILURE_CODES.filter((failure) => failures.has(failure))
}

export function isFounderEvaluationBlocking(metadata: FounderEvaluationMetadata) {
  return metadata.failures.some((failure) => FOUNDER_EVALUATION_P0_FAILURES.has(failure))
    || metadata.scores.sourceFidelity <= 2
    || metadata.scores.agency <= 2
    || metadata.scores.intensityCalibration <= 2
}

export function isFounderGoldenReview(label: string, metadata: unknown) {
  const evaluation = readFounderEvaluationMetadata(metadata)
  return label === "ready"
    && evaluation?.goldenApproval.status === "maria_approved"
    && !isFounderEvaluationBlocking(evaluation)
    && FOUNDER_EVALUATION_AXES.every((axis) => evaluation.scores[axis] >= 4)
}

export function readFounderEvaluationMetadata(value: unknown): FounderEvaluationMetadata | null {
  if (!isRecord(value) || !isRecord(value.founderEvaluation)) return null
  const evaluation = value.founderEvaluation
  if (evaluation.rubricVersion !== FOUNDER_EVALUATION_RUBRIC_VERSION || !isRecord(evaluation.scores)) return null
  const scores = {} as FounderEvaluationScores
  for (const axis of FOUNDER_EVALUATION_AXES) {
    const score = evaluation.scores[axis]
    if (!Number.isInteger(score) || Number(score) < 1 || Number(score) > 5) return null
    scores[axis] = score as FounderEvaluationScore
  }
  if (!Array.isArray(evaluation.failures) || !evaluation.failures.every(isFounderEvaluationFailureCode)) return null
  if (!isRecord(evaluation.versions)) return null
  const versions = evaluation.versions
  if (!FOUNDER_VERSION_KEYS.every((key) => typeof versions[key] === "string" && (versions[key] as string).length > 0)) return null
  if (!isRecord(evaluation.goldenApproval) || !["pending", "maria_approved", "rejected"].includes(String(evaluation.goldenApproval.status))) return null
  return {
    rubricVersion: FOUNDER_EVALUATION_RUBRIC_VERSION,
    scores,
    failures: evaluation.failures,
    versions: versions as FounderEvaluationVersions,
    goldenApproval: {
      status: evaluation.goldenApproval.status as FounderEvaluationMetadata["goldenApproval"]["status"],
      evidence: typeof evaluation.goldenApproval.evidence === "string" && evaluation.goldenApproval.evidence.trim() ? evaluation.goldenApproval.evidence : null,
    },
  }
}

const FOUNDER_VERSION_KEYS = ["model", "prompt", "doctrine", "selector", "validator"] as const

function isFounderEvaluationFailureCode(value: unknown): value is FounderEvaluationFailureCode {
  return typeof value === "string" && FOUNDER_EVALUATION_FAILURE_CODES.includes(value as FounderEvaluationFailureCode)
}

function hasInterchangeableDimensionReflections(reflections: Array<{ dimension: string; text: string }>) {
  for (let leftIndex = 0; leftIndex < reflections.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < reflections.length; rightIndex += 1) {
      const left = tokenize(reflections[leftIndex]?.text ?? "")
      const right = tokenize(reflections[rightIndex]?.text ?? "")
      if (left.size >= 5 && right.size >= 5 && jaccardSimilarity(left, right) >= 0.75) return true
    }
  }
  return false
}

function tokenize(value: string) {
  return new Set(value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((word) => word.length > 3 && !STOP_WORDS.has(word)))
}

function jaccardSimilarity(left: Set<string>, right: Set<string>) {
  const intersection = [...left].filter((word) => right.has(word)).length
  const union = new Set([...left, ...right]).size
  return union ? intersection / union : 0
}

const STOP_WORDS = new Set(["that", "this", "with", "from", "your", "into", "about", "they", "them", "their", "there", "where", "when", "what", "would", "could", "should"])

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}
