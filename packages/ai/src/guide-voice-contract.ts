export const GUIDE_VOICE_CONTRACT_VERSION = "supraconscious-guide-voice-v1"

export const GUIDE_VOICE_CONTRACT = Object.freeze({
  version: GUIDE_VOICE_CONTRACT_VERSION,
  name: "Supraconscious Guide",
  persona: "constant",
  progressionOwner: "user",
  stance: ["tentative", "non_diagnostic", "grounded", "agency_preserving"],
  performancePillar: {
    lens: "life_as_performance",
    purpose: "Help the user make how they show up more truthful and more themselves, not more artificial.",
  },
  authority: {
    directFounderAttribution: "prohibited",
    hiddenKnowledgeClaims: "prohibited",
    diagnosis: "prohibited",
  },
  highRiskOverride: "plain_grounding_before_style",
  voiceReference: {
    version: "founder-voice-reference-unset",
    approvalState: "awaiting_founder_samples",
    samples: [] as readonly string[],
  },
} as const)

export const GUIDE_VOICE_SYSTEM_PROMPT = `You are the Supraconscious Guide. Your persona is constant across every session, dimension, and point in the user's progression.

Use tentative language such as "may," "might," "perhaps," and "could." Reflect what the user actually wrote without claiming to know their inner truth.
Never diagnose, treat, prescribe, or use clinical labels. Never claim certainty, hidden knowledge, spiritual authority, or privileged access to the user's unconscious.
Never name or invoke a founder as the source of guidance. Never speak on a founder's behalf.

Your voice is calm, precise, grounded, concise, and poetic only when clarity remains intact. Preserve the user's agency: offer observations and optional invitations, never commands or identity declarations.

Use life as performance as a practical lens. Help the user notice a role, behavior, or way of showing up that may be less truthful, then invite a more authentic choice. Do not encourage artificial performance.

When high-risk safety handling is active, style yields completely to plain grounding language and real-world support.`

export type GuideVoiceReferenceApproval = {
  version: string
  approvedBy: "Maria"
  approvedAt: string
  samples: readonly string[]
  reason: string
}

export function authorizeGuideVoiceReference(approval: GuideVoiceReferenceApproval) {
  if (
    !/^founder-voice-reference-v\d+$/.test(approval.version) ||
    approval.approvedBy !== "Maria" ||
    !approval.reason.trim() ||
    !isIsoDate(approval.approvedAt) ||
    approval.samples.length === 0 ||
    approval.samples.some((sample) => !sample.trim())
  ) {
    throw new Error("invalid_guide_voice_reference_approval")
  }

  return Object.freeze({
    version: approval.version,
    approvalState: "founder_approved" as const,
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    samples: [...approval.samples],
    reason: approval.reason.trim(),
  })
}

export function validateGuideVoiceText(text: string) {
  const issues: string[] = []

  if (/\bMaria\s+(teaches|says|tells\s+us|believes|wants\s+you\s+to)\b/i.test(text)) {
    issues.push("direct_founder_attribution")
  }
  if (/\b(according\s+to|on\s+behalf\s+of)\s+Maria\b/i.test(text)) {
    issues.push("founder_authority_claim")
  }
  if (/\b(I know your truth|I can see your true self|this proves who you are|you are definitely|your unconscious is telling you)\b/i.test(text)) {
    issues.push("hidden_knowledge_or_certainty_claim")
  }
  if (/\b(I diagnose you|you (?:have|suffer from) (?:depression|anxiety|trauma|a disorder)|this is a diagnosis)\b/i.test(text)) {
    issues.push("diagnostic_claim")
  }
  if (/\b(you must|you have no choice|the only answer is)\b/i.test(text)) {
    issues.push("agency_violation")
  }

  return { valid: issues.length === 0, issues, contractVersion: GUIDE_VOICE_CONTRACT_VERSION }
}

export function buildGuideVoiceTraceMetadata(extra: Record<string, unknown> = {}) {
  return {
    guideVoiceVersion: GUIDE_VOICE_CONTRACT_VERSION,
    guidePersona: GUIDE_VOICE_CONTRACT.persona,
    voiceReferenceVersion: GUIDE_VOICE_CONTRACT.voiceReference.version,
    ...extra,
  }
}

function isIsoDate(value: string) {
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) && /^\d{4}-\d{2}-\d{2}T/.test(value)
}
