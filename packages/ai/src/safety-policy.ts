import { localAiCopy, type ResponseLanguage } from "@inner-avatar/ai/response-language"
import type { SafetyCheck } from "./schemas.js"

export const SAFETY_POLICY_VERSION = "supraconscious-safety-short-circuit-v1"

export type HighRiskCategory =
  | "acute_crisis"
  | "self_harm"
  | "harm_to_others"
  | "immediate_danger"
  | "severe_dissociation"
  | "psychosis_like_destabilization"

type HighRiskRule = {
  category: HighRiskCategory
  patterns: RegExp[]
}

const HIGH_RISK_RULES: HighRiskRule[] = [
  {
    category: "acute_crisis",
    patterns: [
      /\bi\s+(?:cannot|can't)\s+go\s+on\b/i,
      /\bi\s+need\s+(?:urgent|immediate)\s+help\b/i,
    ],
  },
  {
    category: "self_harm",
    patterns: [
      /\b(?:kill|hurt|harm)\s+myself\b/i,
      /\b(?:end|take)\s+my\s+(?:own\s+)?life\b/i,
      /\b(?:suicide|suicidal)\b/i,
      /\bi\s+(?:do not|don't)\s+want\s+to\s+(?:be\s+alive|live)\b/i,
    ],
  },
  {
    category: "harm_to_others",
    patterns: [
      /\b(?:kill|hurt|harm|attack)\s+(?:him|her|them|someone|people|another person)\b/i,
      /\bi(?:'m| am)\s+going\s+to\s+(?:kill|hurt|harm|attack)\b/i,
    ],
  },
  {
    category: "immediate_danger",
    patterns: [
      /\b(?:in|there is)\s+immediate\s+danger\b/i,
      /\b(?:being|getting)\s+attacked\s+right\s+now\b/i,
      /\bsomeone\s+(?:is|is trying to)\s+(?:kill|hurt|harm)\s+me\b/i,
      /\bi(?:'m| am)\s+not\s+safe\s+right\s+now\b/i,
    ],
  },
  {
    category: "severe_dissociation",
    patterns: [
      /\bi\s+(?:cannot|can't)\s+tell\s+what(?:'s| is)\s+real\b/i,
      /\bi(?:'m| am)\s+dissociating\s+(?:badly|right\s+now)\b/i,
      /\bi(?:'m| am)\s+losing\s+time\s+(?:right\s+now|and\s+cannot|and\s+can't)\b/i,
      /\bnothing\s+(?:feels|is)\s+real\s+and\s+i\s+(?:cannot|can't)\s+(?:function|stay safe)\b/i,
    ],
  },
  {
    category: "psychosis_like_destabilization",
    patterns: [
      /\bvoices?\s+(?:are\s+)?telling\s+me\s+to\s+(?:kill|hurt|harm|attack)\b/i,
      /\bvoices?\s+(?:are\s+)?commanding\s+me\b/i,
      /\bi\s+(?:cannot|can't)\s+tell\s+whether\s+the\s+voices?\s+are\s+real\b/i,
      /\bmy\s+thoughts\s+are\s+being\s+(?:inserted|controlled)\b/i,
      /\b(?:the government|they|someone)\s+(?:is|are)\s+(?:watching|tracking)\s+me\b/i,
      /\bi(?:'m| am)\s+hallucinating\s+right\s+now\b/i,
    ],
  },
]

export type CrisisGroundingContent = {
  openingLine: string
  userMessage: string
  patternName: string
  immediateAction: string
  connectionAction: string
  closingLine: string
}

export function detectHighRiskCategories(text: string): HighRiskCategory[] {
  return HIGH_RISK_RULES
    .filter((rule) => rule.patterns.some((pattern) => pattern.test(text)))
    .map((rule) => rule.category)
}

export function enforceSafetyShortCircuit(
  text: string,
  proposed: SafetyCheck,
  language: ResponseLanguage = "en",
): SafetyCheck {
  const deterministicFlags = detectHighRiskCategories(text)
  if (deterministicFlags.length === 0) {
    if (proposed.severity === "high" || proposed.allowReflectiveFlow === false) {
      return { ...proposed, allowReflectiveFlow: false }
    }
    return proposed
  }

  const copy = localAiCopy(language).safety
  return {
    severity: "high",
    flags: Array.from(new Set([...proposed.flags, ...deterministicFlags])),
    recommendedAction: copy.highRecommendedAction,
    userMessage: copy.highUserMessage,
    allowReflectiveFlow: false,
  }
}

export function shouldShortCircuitReflection(safety: Pick<SafetyCheck, "severity" | "allowReflectiveFlow">): boolean {
  return safety.severity === "high" || safety.allowReflectiveFlow === false
}

export function buildCrisisGroundingContent(
  safety: Pick<SafetyCheck, "userMessage">,
  language: ResponseLanguage = "en",
): CrisisGroundingContent {
  const copy = localAiCopy(language)
  return {
    openingLine: copy.council.pauseHere,
    userMessage: safety.userMessage,
    patternName: copy.groundingPattern,
    immediateAction: copy.council.supportQuestion,
    connectionAction: copy.council.groundingStep,
    closingLine: copy.council.groundingClose,
  }
}
