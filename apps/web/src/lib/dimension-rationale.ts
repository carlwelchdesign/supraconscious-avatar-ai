const PUBLIC_DIMENSIONS = [
  "perception",
  "story",
  "fear",
  "ego",
  "genius",
  "supraconscious",
  "embodiment",
] as const

export type PublicDimension = (typeof PUBLIC_DIMENSIONS)[number]
export type PublicDimensionSignal =
  | "present_entry"
  | "meaning_and_perspective"
  | "protection_or_risk"
  | "identity_or_role"
  | "possibility_or_capacity"
  | "choice_and_agency"
  | "body_or_action"
  | "prior_preference"

type InternalDimensionSelection = {
  safetyMode: string
  selected: Array<{
    dimension: string
    order: number
    depth: number
    reasonCodes: string[]
  }>
}

export type PublicDimensionRationale = {
  reflectionSessionId: string | null
  mode: "reflective" | "gentle_reflection"
  selected: Array<{
    dimension: PublicDimension
    order: number
    depth: 1 | 2 | 3
    signals: PublicDimensionSignal[]
  }>
}

const REASON_SIGNAL_MAP: Readonly<Record<string, PublicDimensionSignal>> = {
  current_entry_anchor: "present_entry",
  story_meaning_signal: "meaning_and_perspective",
  observer_vantage_available: "meaning_and_perspective",
  protective_signal: "protection_or_risk",
  identity_or_role_signal: "identity_or_role",
  possibility_signal: "possibility_or_capacity",
  protection_capacity_pair: "possibility_or_capacity",
  choice_authorship: "choice_and_agency",
  embodied_action_signal: "body_or_action",
  prior_user_preference: "prior_preference",
}

export function buildPublicDimensionRationale(
  selection: InternalDimensionSelection | null | undefined,
  reflectionSessionId?: string | null,
): PublicDimensionRationale | null {
  if (!selection || selection.safetyMode === "plain_grounding" || selection.selected.length === 0) {
    return null
  }

  const selected = selection.selected.flatMap((item) => {
    if (!isPublicDimension(item.dimension)) return []
    const signals = Array.from(new Set(item.reasonCodes.flatMap((reason) => {
      const signal = REASON_SIGNAL_MAP[reason]
      return signal ? [signal] : []
    })))
    return [{
      dimension: item.dimension,
      order: item.order,
      depth: normalizeDepth(item.depth),
      signals,
    }]
  })

  if (selected.length === 0) return null

  return {
    reflectionSessionId: reflectionSessionId ?? null,
    mode: selection.safetyMode === "gentle_reflection" ? "gentle_reflection" : "reflective",
    selected,
  }
}

function isPublicDimension(value: string): value is PublicDimension {
  return (PUBLIC_DIMENSIONS as readonly string[]).includes(value)
}

function normalizeDepth(value: number): 1 | 2 | 3 {
  if (value >= 3) return 3
  if (value >= 2) return 2
  return 1
}
