import { FOUNDER_CONTEXT_SOURCES, type FounderContextSourceKey } from "./founder-context-registry.js"

export const FOUNDER_DECISION_REGISTRY_VERSION = "founder-decisions-v2"

export const FOUNDER_DECISION_IDS = [
  "public_product_name",
  "confrontation_calibration",
  "additional_source_clearance",
  "broader_launch_cohort",
  "one_session_promise",
  "approved_voice_reference",
  "dimension_selection_rule",
  "public_author_attribution",
  "prompt_companion_copy",
  "professional_reviewers_and_signoff",
] as const

export type FounderDecisionId = (typeof FOUNDER_DECISION_IDS)[number]
export type FounderDecisionStatus = "pending" | "approved" | "rejected" | "superseded"
export type FounderDecisionGate =
  | "internal_schema"
  | "public_naming"
  | "prompt_release"
  | "returning_user_progression"
  | "founder_calibration"
  | "broader_pilot"

export type FounderDecision = {
  id: FounderDecisionId
  question: string
  responsible: "Carl"
  accountable: "Maria" | "Professional reviewers"
  status: FounderDecisionStatus
  decision: string | null
  rationale: string | null
  decidedAt: string | null
  evidence: readonly FounderDecisionEvidence[]
  impactedTickets: readonly string[]
  blocks: readonly FounderDecisionGate[]
}

export type FounderDecisionEvidence = {
  sourceKey: FounderContextSourceKey
  locator: string
}

export type FounderDecisionResolution = {
  status: Exclude<FounderDecisionStatus, "pending">
  decision: string
  rationale: string
  decidedAt: string
  evidence: readonly FounderDecisionEvidence[]
}

const REGISTERED_FOUNDER_CONTEXT_SOURCE_KEYS = new Set(
  FOUNDER_CONTEXT_SOURCES.map((source) => source.key),
)

export const FOUNDER_DECISIONS: readonly FounderDecision[] = [
  {
    id: "public_product_name",
    question:
      "Is SupraAI the final public name/domain while Supraconscious Avatar AI remains formal/legal, or does SupraAI replace it everywhere?",
    responsible: "Carl",
    accountable: "Maria",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-030", "FCA-044", "FCA-050"],
    blocks: ["public_naming"],
  },
  {
    id: "confrontation_calibration",
    question: 'What are 2–3 "too harsh," "too soft," and "just right" worked examples?',
    responsible: "Carl",
    accountable: "Maria",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-012", "FCA-024", "FCA-043", "FCA-052"],
    blocks: ["founder_calibration"],
  },
  {
    id: "additional_source_clearance",
    question: "Which manuscripts, workshop notes, and transcripts beyond published books are cleared?",
    responsible: "Carl",
    accountable: "Maria",
    status: "approved",
    decision:
      "Only published works are currently cleared. No unpublished manuscript, workshop note, or transcript may be used until Maria explicitly clears it and the intended use passes rights review.",
    rationale:
      "Maria confirmed published work as the safest authority tier and kept unpublished material unapproved until cleared; the supplied v1 prompt libraries identify published sources only.",
    decidedAt: "2026-07-31",
    evidence: [
      {
        sourceKey: "founder_decision_brief_v3",
        locator: "Sections 11, A, B, and C.3",
      },
    ],
    impactedTickets: ["FCA-011", "FCA-025", "FCA-040", "FCA-041"],
    blocks: ["prompt_release", "broader_pilot"],
  },
  {
    id: "broader_launch_cohort",
    question: "Is the broader launch cohort the general public, Maria's audience, or a curated beta?",
    responsible: "Carl",
    accountable: "Maria",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-050", "FCA-053", "FCA-054"],
    blocks: ["broader_pilot"],
  },
  {
    id: "one_session_promise",
    question: "What is the exact one-sentence after-one-session promise?",
    responsible: "Carl",
    accountable: "Maria",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-030", "FCA-044", "FCA-052"],
    blocks: ["founder_calibration"],
  },
  {
    id: "approved_voice_reference",
    question: "What 3–5 sentences establish the approved voice reference?",
    responsible: "Carl",
    accountable: "Maria",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-024", "FCA-043", "FCA-052"],
    blocks: ["founder_calibration"],
  },
  {
    id: "dimension_selection_rule",
    question: "What rule should select dimensions first or deeper for new versus returning users?",
    responsible: "Carl",
    accountable: "Maria",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-022", "FCA-031", "FCA-042", "FCA-050"],
    blocks: ["returning_user_progression"],
  },
  {
    id: "public_author_attribution",
    question:
      "May public source citations name Maria as a book author when rights require attribution, or must all public citations omit her name?",
    responsible: "Carl",
    accountable: "Professional reviewers",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-011", "FCA-040", "FCA-041", "FCA-044"],
    blocks: ["prompt_release", "broader_pilot"],
  },
  {
    id: "prompt_companion_copy",
    question:
      "May product-level safety, accessibility, opt-out, duration, and localization copy appear alongside the exact prompt text?",
    responsible: "Carl",
    accountable: "Professional reviewers",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-010", "FCA-011", "FCA-025", "FCA-044"],
    blocks: ["prompt_release", "broader_pilot"],
  },
  {
    id: "professional_reviewers_and_signoff",
    question:
      "Who are the named professional safety reviewer and legal/privacy reviewer, and what artifacts constitute sign-off?",
    responsible: "Carl",
    accountable: "Professional reviewers",
    status: "pending",
    decision: null,
    rationale: null,
    decidedAt: null,
    evidence: [],
    impactedTickets: ["FCA-010", "FCA-011", "FCA-053", "FCA-054"],
    blocks: ["prompt_release", "broader_pilot"],
  },
] as const

export function resolveFounderDecision(
  id: FounderDecisionId,
  resolution: FounderDecisionResolution,
  decisions: readonly FounderDecision[] = FOUNDER_DECISIONS,
): FounderDecision[] {
  if (
    !resolution.decision.trim() ||
    !resolution.rationale.trim() ||
    !isIsoDate(resolution.decidedAt) ||
    resolution.evidence.length === 0 ||
    !resolution.evidence.every(isValidDecisionEvidence)
  ) {
    throw new Error(`invalid_founder_decision_resolution:${id}`)
  }

  let found = false
  const updated = decisions.map((decision) => {
    if (decision.id !== id) return { ...decision }
    found = true
    return {
      ...decision,
      ...resolution,
      decision: resolution.decision.trim(),
      rationale: resolution.rationale.trim(),
    }
  })

  if (!found) {
    throw new Error(`unknown_founder_decision:${id}`)
  }
  return updated
}

export function evaluateFounderDecisionGates(
  decisions: readonly FounderDecision[] = FOUNDER_DECISIONS,
) {
  const pendingByGate = Object.fromEntries(
    [
      "internal_schema",
      "public_naming",
      "prompt_release",
      "returning_user_progression",
      "founder_calibration",
      "broader_pilot",
    ].map((gate) => [gate, [] as FounderDecisionId[]]),
  ) as Record<FounderDecisionGate, FounderDecisionId[]>

  for (const decision of decisions) {
    if (decision.status === "approved") continue
    for (const gate of decision.blocks) {
      pendingByGate[gate].push(decision.id)
    }
  }

  return {
    registryVersion: FOUNDER_DECISION_REGISTRY_VERSION,
    pendingCount: decisions.filter((decision) => decision.status === "pending").length,
    pendingByGate,
    gates: Object.fromEntries(
      Object.entries(pendingByGate).map(([gate, blockers]) => [gate, blockers.length === 0]),
    ) as Record<FounderDecisionGate, boolean>,
  }
}

export function validateFounderDecisionRegistry(
  decisions: readonly FounderDecision[] = FOUNDER_DECISIONS,
) {
  const errors: string[] = []
  const ids = new Set(decisions.map((decision) => decision.id))

  if (decisions.length !== 10 || ids.size !== 10) {
    errors.push("founder_decision_registry_requires_ten_unique_decisions")
  }

  for (const decision of decisions) {
    const hasAnyResolution =
      Boolean(decision.decision?.trim()) ||
      Boolean(decision.rationale?.trim()) ||
      Boolean(decision.decidedAt) ||
      decision.evidence.length > 0
    const completeResolution =
      Boolean(decision.decision?.trim()) &&
      Boolean(decision.rationale?.trim()) &&
      Boolean(decision.decidedAt && isIsoDate(decision.decidedAt)) &&
      decision.evidence.length > 0 &&
      decision.evidence.every(isValidDecisionEvidence)

    if (decision.status === "pending" && hasAnyResolution) {
      errors.push(`pending_decision_contains_resolution:${decision.id}`)
    }
    if (decision.status !== "pending" && !completeResolution) {
      errors.push(`resolved_decision_missing_evidence:${decision.id}`)
    }
    if (decision.impactedTickets.length === 0) {
      errors.push(`decision_missing_impacted_tickets:${decision.id}`)
    }
  }

  return { valid: errors.length === 0, errors }
}

function isValidDecisionEvidence(evidence: FounderDecisionEvidence) {
  return (
    REGISTERED_FOUNDER_CONTEXT_SOURCE_KEYS.has(evidence.sourceKey) &&
    Boolean(evidence.locator.trim())
  )
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
}
