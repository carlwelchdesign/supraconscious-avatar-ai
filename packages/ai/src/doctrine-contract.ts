import {
  SUPRACONSCIOUS_DIMENSIONS,
  type SupraconsciousDimension,
} from "./founder-context-registry.js"

export const DOCTRINE_CONTRACT_VERSION = "supraconscious-doctrine-v1"

export const DIMENSION_CONTRACT: Readonly<
  Record<
    SupraconsciousDimension,
    {
      question: string
      distinction: string
      forbiddenCollapse: string
    }
  >
> = Object.freeze({
  perception: {
    question: "What am I noticing?",
    distinction: "Concrete present noticing, sensations, facts, and frame.",
    forbiddenCollapse: "Do not treat interpretation as observation.",
  },
  story: {
    question: "What meaning have I created?",
    distinction: "User-created meaning viewed from the Observer stance.",
    forbiddenCollapse: "Do not call remembered Story objective truth.",
  },
  fear: {
    question: "What am I protecting?",
    distinction: "Anticipated loss, risk, and protective function.",
    forbiddenCollapse: "Do not equate Fear with proof of danger.",
  },
  ego: {
    question: "Which identity is responding?",
    distinction: "Persona, role, control, performance, and learned identity.",
    forbiddenCollapse: "Do not shame or define the whole user.",
  },
  genius: {
    question: "What higher possibility is available?",
    distinction: "Existing possibility, creativity, truthfulness, and capacity.",
    forbiddenCollapse: "Do not flatter, promise manifestation, or imply spiritual superiority.",
  },
  supraconscious: {
    question: "What conscious choice is now possible?",
    distinction: "Agency, discernment, responsibility, and authorship.",
    forbiddenCollapse: "Do not choose for the user.",
  },
  embodiment: {
    question: "How will I live that choice?",
    distinction: "Voluntary action or physical awareness practice.",
    forbiddenCollapse: "Do not require action, intensity, or completion.",
  },
})

export const REMOVED_PUBLIC_TERMS = [
  "Inner Council",
  "Threshold",
  "Revelation",
  "Echo",
  "Witness",
  "Clear Mirror",
  "Reframer",
  "Inner Author",
] as const

export const DOCTRINE_CONTRACT = Object.freeze({
  version: DOCTRINE_CONTRACT_VERSION,
  frameworkName: "The Seven Dimensions of the Supraconscious",
  dimensions: SUPRACONSCIOUS_DIMENSIONS,
  dimensionContract: DIMENSION_CONTRACT,
  entry: {
    term: "Mirror",
    meaning: "The self-inquiry entry point; it does not reveal hidden truth or diagnose the user.",
  },
  observer: {
    meaning: "The unattached vantage used to observe the Story dimension.",
    isDimension: false,
    isGuideStage: false,
  },
  guide: {
    name: "Supraconscious Guide",
    persona: "constant",
    progressionOwner: "user",
  },
  sourceModes: [
    "approved_source",
    "general_reflection",
    "no_eligible_source",
    "grounding",
  ],
  promptPolicy: {
    publicText: "immutable_per_approved_revision",
    modelMayRewrite: false,
    genericFallbackAllowed: false,
  },
  authority: {
    directMariaAttribution: "prohibited",
    diagnosis: "prohibited",
    hiddenKnowledgeClaims: "prohibited",
    language: "tentative",
  },
  safety: {
    highRiskBehavior: "exit_reflection_for_plain_grounding",
    professionalReviewRequiredBeforeBroaderPilot: true,
  },
  agency: {
    userMayDecline: true,
    userMayCorrect: true,
    userMayStop: true,
    embodimentIsOptional: true,
  },
} as const)

export type PublicCopyValidationOptions = {
  contentMode?: "new_public_copy" | "historical_payload"
}

export type DoctrineRevisionApproval = {
  approvedBy: "Maria"
  approvedAt: string
  reason: string
}

export function validatePublicCopyAgainstDoctrine(
  text: string,
  options: PublicCopyValidationOptions = {},
) {
  if (options.contentMode === "historical_payload") {
    return { valid: true, issues: [] as string[], doctrineVersion: DOCTRINE_CONTRACT_VERSION }
  }

  const issues: string[] = []
  for (const term of REMOVED_PUBLIC_TERMS) {
    if (new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(text)) {
      issues.push(`removed_public_term:${term}`)
    }
  }

  if (/\bMaria\s+(teaches|says|tells\s+us|believes)\b/i.test(text)) {
    issues.push("direct_maria_attribution")
  }
  if (/\b(seven\s+)?(lenses|levels|parts\s+of\s+the\s+psyche)\b/i.test(text)) {
    issues.push("superseded_framework_language")
  }
  if (/\b(I know your truth|this proves who you are|you are definitely)\b/i.test(text)) {
    issues.push("hidden_knowledge_or_certainty_claim")
  }

  return {
    valid: issues.length === 0,
    issues,
    doctrineVersion: DOCTRINE_CONTRACT_VERSION,
  }
}

export function buildDoctrineTraceMetadata(extra: Record<string, unknown> = {}) {
  return {
    doctrineVersion: DOCTRINE_CONTRACT_VERSION,
    guidePersona: DOCTRINE_CONTRACT.guide.persona,
    frameworkName: DOCTRINE_CONTRACT.frameworkName,
    ...extra,
  }
}

export function authorizeDoctrineRevision(
  proposedVersion: string,
  approval: DoctrineRevisionApproval,
) {
  if (
    !/^supraconscious-doctrine-v\d+$/.test(proposedVersion) ||
    proposedVersion === DOCTRINE_CONTRACT_VERSION ||
    !approval.reason.trim() ||
    !isIsoDate(approval.approvedAt)
  ) {
    throw new Error("invalid_doctrine_revision_approval")
  }

  return {
    currentVersion: DOCTRINE_CONTRACT_VERSION,
    proposedVersion,
    approvedBy: approval.approvedBy,
    approvedAt: approval.approvedAt,
    reason: approval.reason.trim(),
  }
}

function isIsoDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00.000Z`))
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
