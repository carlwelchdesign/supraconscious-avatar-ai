import { DOCTRINE_CONTRACT_VERSION } from "./doctrine-contract.js"
import {
  SUPRACONSCIOUS_DIMENSIONS,
  type SupraconsciousDimension,
} from "./founder-context-registry.js"
import type { EntryAnalysis, SafetyCheck } from "./schemas.js"

export const DIMENSION_SELECTOR_VERSION = "conservative-dimension-selector-v1"

export type DimensionDepth = 1 | 2 | 3
export type DimensionHandlingPreference = "standard" | "simpler" | "gentler"
export type DimensionSelectionReasonCode =
  | "current_entry_anchor"
  | "story_meaning_signal"
  | "observer_vantage_available"
  | "protective_signal"
  | "identity_or_role_signal"
  | "possibility_signal"
  | "protection_capacity_pair"
  | "choice_authorship"
  | "embodied_action_signal"
  | "prior_user_preference"
export type DimensionSuppressionReasonCode =
  | "plain_grounding_redirect"
  | "gentler_handling"
  | "simpler_handling_limit"
  | "prior_user_correction"

export type DimensionSelectionEvidenceRef = {
  source: "entry" | "analysis" | "user_preference" | "user_correction"
  signal: string
}

export type SelectedDimension = {
  dimension: SupraconsciousDimension
  order: number
  depth: DimensionDepth
  reasonCodes: DimensionSelectionReasonCode[]
  evidenceRefs: DimensionSelectionEvidenceRef[]
  observerVantage: boolean
}

export type DimensionSelection = {
  selectorVersion: string
  doctrineVersion: string
  policySource: "conservative_fallback_pending_founder_decision"
  orderingPolicy: "adaptive_session_flow_not_dimension_rank"
  handlingPreference: DimensionHandlingPreference
  safetyMode: "reflective" | "gentle_reflection" | "plain_grounding"
  selected: SelectedDimension[]
  suppressed: Array<{
    dimension: SupraconsciousDimension
    reasonCode: DimensionSuppressionReasonCode
  }>
  returningContext: {
    eligible: boolean
    used: boolean
    reason: "not_provided" | "consent_missing" | "controls_not_ready" | "enabled"
  }
}

export type DimensionSelectionCorrection = {
  dimension: SupraconsciousDimension
  action: "prefer" | "suppress"
}

export type DimensionSelectionInput = {
  text: string
  safety: SafetyCheck
  analysis?: EntryAnalysis | null
  handlingPreference?: DimensionHandlingPreference
  preferredIntensity?: number
  returningContext?: {
    enabledByUser: boolean
    correctionControlsReady: boolean
    corrections?: DimensionSelectionCorrection[]
  }
}

type Candidate = Omit<SelectedDimension, "order">

export function selectDimensions(input: DimensionSelectionInput): DimensionSelection {
  const handlingPreference = input.handlingPreference ?? "standard"
  const returningContext = resolveReturningContext(input.returningContext)

  if (!input.safety.allowReflectiveFlow || input.safety.severity === "high") {
    return {
      selectorVersion: DIMENSION_SELECTOR_VERSION,
      doctrineVersion: DOCTRINE_CONTRACT_VERSION,
      policySource: "conservative_fallback_pending_founder_decision",
      orderingPolicy: "adaptive_session_flow_not_dimension_rank",
      handlingPreference,
      safetyMode: "plain_grounding",
      selected: [],
      suppressed: SUPRACONSCIOUS_DIMENSIONS.map((dimension) => ({ dimension, reasonCode: "plain_grounding_redirect" })),
      returningContext,
    }
  }

  const candidates = new Map<SupraconsciousDimension, Candidate>()
  const suppressed = new Map<SupraconsciousDimension, DimensionSuppressionReasonCode>()
  const normalized = input.text.toLowerCase()
  const baseDepth = resolveBaseDepth(input.preferredIntensity, handlingPreference, input.safety)

  addCandidate(candidates, "perception", baseDepth, ["current_entry_anchor"], [{ source: "entry", signal: "present_reflection" }])
  addCandidate(candidates, "supraconscious", 1, ["choice_authorship"], [{ source: "entry", signal: "user_authors_choice" }])

  if (hasStorySignal(normalized, input.analysis)) {
    addCandidate(candidates, "story", baseDepth, ["story_meaning_signal", "observer_vantage_available"], storyEvidence(input.analysis), true)
  }
  if (hasProtectionSignal(normalized, input.analysis)) {
    addCandidate(candidates, "fear", baseDepth, ["protective_signal"], [{ source: "entry", signal: "protection_or_anticipated_loss_language" }])
    addCandidate(candidates, "genius", 1, ["protection_capacity_pair"], [{ source: "analysis", signal: "capacity_counterbalance_without_flattery" }])
  } else if (hasPossibilitySignal(normalized)) {
    addCandidate(candidates, "genius", baseDepth, ["possibility_signal"], [{ source: "entry", signal: "possibility_or_capacity_language" }])
  }
  if (hasIdentitySignal(normalized)) {
    addCandidate(candidates, "ego", baseDepth, ["identity_or_role_signal"], [{ source: "entry", signal: "identity_role_or_performance_language" }])
  }
  if (hasEmbodimentSignal(normalized)) {
    addCandidate(candidates, "embodiment", 1, ["embodied_action_signal"], [{ source: "entry", signal: "body_action_or_practice_language" }])
  }

  if (returningContext.used) {
    for (const correction of input.returningContext?.corrections ?? []) {
      if (correction.action === "suppress") {
        candidates.delete(correction.dimension)
        suppressed.set(correction.dimension, "prior_user_correction")
      } else {
        addCandidate(candidates, correction.dimension, 1, ["prior_user_preference"], [{ source: "user_correction", signal: "explicit_dimension_preference" }], correction.dimension === "story")
      }
    }
  }

  if (input.safety.severity === "medium" || handlingPreference === "gentler") {
    for (const dimension of ["fear", "ego", "genius", "embodiment"] as const) {
      if (candidates.delete(dimension)) suppressed.set(dimension, "gentler_handling")
    }
  }

  const maxDimensions = handlingPreference === "standard" ? 6 : handlingPreference === "simpler" ? 4 : 3
  const selectedCandidates = orderCandidates(candidates)
  const limitedCandidates = limitCandidates(selectedCandidates, maxDimensions)
  for (const candidate of selectedCandidates.filter((candidate) => !limitedCandidates.includes(candidate))) {
    suppressed.set(candidate.dimension, "simpler_handling_limit")
  }

  const selected = limitedCandidates.map((candidate, index) => ({
    ...candidate,
    order: index + 1,
  }))

  return {
    selectorVersion: DIMENSION_SELECTOR_VERSION,
    doctrineVersion: DOCTRINE_CONTRACT_VERSION,
    policySource: "conservative_fallback_pending_founder_decision",
    orderingPolicy: "adaptive_session_flow_not_dimension_rank",
    handlingPreference,
    safetyMode: input.safety.severity === "medium" || handlingPreference === "gentler" ? "gentle_reflection" : "reflective",
    selected,
    suppressed: SUPRACONSCIOUS_DIMENSIONS.flatMap((dimension) => {
      const reasonCode = suppressed.get(dimension)
      return reasonCode ? [{ dimension, reasonCode }] : []
    }),
    returningContext,
  }
}

function addCandidate(
  candidates: Map<SupraconsciousDimension, Candidate>,
  dimension: SupraconsciousDimension,
  depth: DimensionDepth,
  reasonCodes: DimensionSelectionReasonCode[],
  evidenceRefs: DimensionSelectionEvidenceRef[],
  observerVantage = false,
) {
  const existing = candidates.get(dimension)
  candidates.set(dimension, {
    dimension,
    depth: existing ? Math.max(existing.depth, depth) as DimensionDepth : depth,
    reasonCodes: Array.from(new Set([...(existing?.reasonCodes ?? []), ...reasonCodes])),
    evidenceRefs: uniqueEvidence([...(existing?.evidenceRefs ?? []), ...evidenceRefs]),
    observerVantage: existing?.observerVantage === true || observerVantage,
  })
}

function orderCandidates(candidates: Map<SupraconsciousDimension, Candidate>) {
  return Array.from(candidates.values())
}

function limitCandidates(candidates: Candidate[], maxDimensions: number) {
  if (candidates.length <= maxDimensions) return candidates

  const requiredDimensions = new Set<SupraconsciousDimension>(["perception", "supraconscious"])
  if (candidates.some((candidate) => candidate.dimension === "fear")) {
    requiredDimensions.add("fear")
    requiredDimensions.add("genius")
  }

  const selected = candidates.filter((candidate) => requiredDimensions.has(candidate.dimension))
  for (const candidate of candidates) {
    if (selected.length >= maxDimensions) break
    if (!selected.includes(candidate)) selected.push(candidate)
  }

  return candidates.filter((candidate) => selected.includes(candidate))
}

function resolveReturningContext(context: DimensionSelectionInput["returningContext"]): DimensionSelection["returningContext"] {
  if (!context) return { eligible: false, used: false, reason: "not_provided" }
  if (!context.enabledByUser) return { eligible: false, used: false, reason: "consent_missing" }
  if (!context.correctionControlsReady) return { eligible: false, used: false, reason: "controls_not_ready" }
  return { eligible: true, used: true, reason: "enabled" }
}

function resolveBaseDepth(preferredIntensity: number | undefined, preference: DimensionHandlingPreference, safety: SafetyCheck): DimensionDepth {
  if (preference !== "standard" || safety.severity === "medium") return 1
  if (typeof preferredIntensity === "number" && preferredIntensity >= 4) return 2
  return 1
}

function hasStorySignal(text: string, analysis?: EntryAnalysis | null) {
  return /\b(?:meaning|story|believe|assume|interpret|remember|tell myself|must mean)\b/i.test(text)
    || Boolean(analysis?.contradictionSignals.length)
}

function hasProtectionSignal(text: string, analysis?: EntryAnalysis | null) {
  return /\b(?:afraid|fear|protect|risk|lose|loss|unsafe|avoid|threat|worried|anxious)\b/i.test(text)
    || Boolean(analysis?.avoidanceSignals.length)
}

function hasPossibilitySignal(text: string) {
  return /\b(?:possible|possibility|create|capacity|gift|strength|imagine|could become|want to build)\b/i.test(text)
}

function hasIdentitySignal(text: string) {
  return /\b(?:identity|role|perform|persona|who i am|supposed to be|control|approval|prove myself)\b/i.test(text)
}

function hasEmbodimentSignal(text: string) {
  return /\b(?:body|breath|breathe|feet|hands|shoulders|chest|walk|stand|sit|practice|act|action|do today)\b/i.test(text)
}

function storyEvidence(analysis?: EntryAnalysis | null): DimensionSelectionEvidenceRef[] {
  return analysis?.contradictionSignals.length
    ? [{ source: "analysis", signal: "tentative_meaning_or_contradiction" }]
    : [{ source: "entry", signal: "meaning_making_language" }]
}

function uniqueEvidence(evidence: DimensionSelectionEvidenceRef[]) {
  return Array.from(new Map(evidence.map((item) => [`${item.source}:${item.signal}`, item])).values())
}
