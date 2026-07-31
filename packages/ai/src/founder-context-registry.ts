import { createHash } from "node:crypto"

export const FOUNDER_CONTEXT_REGISTRY_VERSION = "founder-context-v1"

export const SUPRACONSCIOUS_DIMENSIONS = [
  "perception",
  "story",
  "fear",
  "ego",
  "genius",
  "supraconscious",
  "embodiment",
] as const

export type SupraconsciousDimension = (typeof SUPRACONSCIOUS_DIMENSIONS)[number]
export type FounderContextSourceKey =
  | "founder_decision_brief_v3"
  | "physical_prompt_library_v1"
  | "mental_prompt_library_v1"
  | "foundational_consciousness_architecture_v1"

export type FounderContextSource = {
  key: FounderContextSourceKey
  title: string
  version: string
  precedence: number
  suppliedDate: string
  registeredAt: string
  registeredBy: "Carl Welch"
  suppliedBy: "Maria"
  changeReason: string
  intendedUse: "product_doctrine" | "curated_prompt_library" | "reference_only"
  founderApprovalState: "founder_confirmed" | "founder_supplied"
  rightsState: "needs_legal_review"
  retrievalState: "blocked"
  checksum: string
  checksumScope: "source_artifact" | "normalized_registry_payload"
  supersedes: string[]
}

export type CuratedPrompt = {
  key: string
  version: 1
  modality: "physical" | "mental"
  dimensions: readonly SupraconsciousDimension[]
  publicTitle?: string
  publicText: string
  sourceWork: string
  originalExercise: string
  approvalState: "founder_supplied"
  rightsState: "needs_legal_review"
  retrievalState: "blocked"
}

export const FOUNDER_CONTEXT_APPROVED_CHECKSUMS: Readonly<Record<FounderContextSourceKey, string>> =
  Object.freeze({
    founder_decision_brief_v3: "4579c504bea179ba1a503a139842bb2df56d209e968231b5b4246e0ab7c74a75",
    physical_prompt_library_v1: "34e1e9a2f945bf7d8153c005a37072f74bae827c89e4d4c8a243b2faa605e2f2",
    mental_prompt_library_v1: "8f920bfb528f3266be674800609e2fdf800b2bc9614c510b059680397a478ee5",
    foundational_consciousness_architecture_v1:
      "40f6c0d4f5cd27e88569747869a32e32ab7606d71da433b7b57bd5d91734577b",
  })

export const LOCKED_DOCTRINE = Object.freeze({
  frameworkName: "The Seven Dimensions of the Supraconscious",
  dimensions: SUPRACONSCIOUS_DIMENSIONS,
  entryTerm: "Mirror",
  observerMeaning: "The unattached observer of the Story dimension.",
  innerAvatarStatus: "approved_vocabulary",
  guidePersona: "constant",
  sessionStructure: "variable_dimension_count_and_depth",
  progression: "user_consciousness_not_ai_advancement",
  directMariaAttribution: "prohibited",
  privacyRegister: "legal_sounding",
  category: "self_inquiry",
} as const)

export const CURATED_PROMPTS: readonly CuratedPrompt[] = [
  {
    key: "physical.release_into_body",
    version: 1,
    modality: "physical",
    dimensions: ["embodiment"],
    publicTitle: "Release into the Body",
    publicText:
      "Starting at your hands, notice where you're holding tension. Let it go, one part of your body at a time — hands, shoulders, jaw. Nothing needs to happen until it does.",
    sourceWork: "Supraconscious",
    originalExercise: "Strasberg's Relaxation Exercise",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.sensory_anchor",
    version: 1,
    modality: "physical",
    dimensions: ["perception"],
    publicTitle: "Sensory Anchor",
    publicText:
      "Touch the nearest surface. Describe its texture in one sentence. Let that be more real, right now, than the thought looping in your head.",
    sourceWork: "Supraconscious",
    originalExercise: "Sense Memory",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.inner_map_return",
    version: 1,
    modality: "physical",
    dimensions: ["story"],
    publicTitle: "The Inner Map Return",
    publicText:
      "Has your body felt this exact way before? Go there for one breath. What does that memory know that today doesn't yet?",
    sourceWork: "Supraconscious",
    originalExercise: "Affective (Emotional) Memory",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.act_as_if",
    version: 1,
    modality: "physical",
    dimensions: ["genius", "supraconscious"],
    publicTitle: 'Act "As If"',
    publicText:
      "For the next minute, walk, sit, or speak as if you already made this choice. Let your body answer before your mind does.",
    sourceWork: "Supraconscious",
    originalExercise: "The Magic If",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.enter_frame",
    version: 1,
    modality: "physical",
    dimensions: ["perception", "story"],
    publicTitle: "Enter the Frame",
    publicText:
      "Name exactly where you are, who's involved, and what's actually true right now — not the story about it, just the facts of this frame.",
    sourceWork: "Supraconscious",
    originalExercise: "Given Circumstances",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.borrow_future_self",
    version: 1,
    modality: "physical",
    dimensions: ["genius"],
    publicTitle: "Borrow the Future Self",
    publicText:
      "Close your eyes for ten seconds. Let your future self — the one who already knows how this turns out — answer instead of you.",
    sourceWork: "Supraconscious",
    originalExercise: "Substitution",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.unwitnessed_truth",
    version: 1,
    modality: "physical",
    dimensions: ["ego"],
    publicTitle: "The Unwitnessed Truth",
    publicText:
      "If no one were watching — not even the version of you that performs for others — what would you actually do right now?",
    sourceWork: "Supraconscious",
    originalExercise: "Private Moment",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.name_it_twice",
    version: 1,
    modality: "physical",
    dimensions: ["ego"],
    publicTitle: "Name It Twice",
    publicText:
      "Say what you're feeling in one sentence. Now say it again, differently. Which version came from the ego trying to protect you, and which came from somewhere truer?",
    sourceWork: "Supraconscious",
    originalExercise: "Repetition Exercise (Meisner)",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.one_gesture",
    version: 1,
    modality: "physical",
    dimensions: ["embodiment"],
    publicTitle: "The One Gesture",
    publicText:
      "If this choice had one physical gesture, what would it be? Do it once, with your whole body, not just your hands.",
    sourceWork: "Supraconscious",
    originalExercise: "Psychological Gesture (Chekhov)",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "physical.narrow_frame",
    version: 1,
    modality: "physical",
    dimensions: ["perception"],
    publicTitle: "Narrow the Frame",
    publicText:
      "Pick one small thing in front of you. Give it your full attention for ten seconds — nothing else exists in that window.",
    sourceWork: "Supraconscious",
    originalExercise: "Concentration / Circle of Attention",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.perception_projection",
    version: 1,
    modality: "mental",
    dimensions: ["perception"],
    publicText:
      "Look at one object near you. Ask: if this is my own projection, what is it showing me back?",
    sourceWork: "Supraconscious: The Genius Within You",
    originalExercise: "Nature Exercise",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.perception_wholeness",
    version: 1,
    modality: "mental",
    dimensions: ["perception"],
    publicText:
      "Name one part of your life that's thriving right now, and one part that's quietly starving. Just name them — no fixing yet.",
    sourceWork: "Not Mars. Not Venus. Just Us.",
    originalExercise: "Wholeness Check-in",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.story_identity_without_labels",
    version: 1,
    modality: "mental",
    dimensions: ["story"],
    publicText:
      "If your name were erased from every form, file, and title you hold, what about you would still be completely true?",
    sourceWork: "Supraconscious: The Genius Within You",
    originalExercise: "ID Exercise",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.story_braver_question",
    version: 1,
    modality: "mental",
    dimensions: ["story"],
    publicText:
      "Take a question you've been asking yourself lately. Ask instead: who taught me to ask it this way — and what's the braver version of this question?",
    sourceWork: "Not Mars. Not Venus. Just Us.",
    originalExercise: "Ask the Right Questions",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.fear_unspoken_truth",
    version: 1,
    modality: "mental",
    dimensions: ["fear"],
    publicText: "What truth are you avoiding saying out loud right now — even just to yourself?",
    sourceWork: "Not Mars. Not Venus. Just Us.",
    originalExercise: "Secret Rule Questions for Both Men and Women",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.fear_language_shift",
    version: 1,
    modality: "mental",
    dimensions: ["fear"],
    publicText:
      'Notice the phrase you default to under pressure — "I have to," "what if I fail." Say the Supraconscious version instead, out loud, once: "I choose to," "what if I learn."',
    sourceWork: "The Birth of Business Genius",
    originalExercise: "Micro-Mindset Shifts",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.ego_persona",
    version: 1,
    modality: "mental",
    dimensions: ["ego"],
    publicText:
      "Which persona are you wearing in this exact moment — the one that keeps you safe, admired, or in control? Set it down for ten seconds. What's still there?",
    sourceWork: "Supraconscious: The Genius Within You",
    originalExercise: "Ego Exercise",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.ego_repeated_voice",
    version: 1,
    modality: "mental",
    dimensions: ["ego"],
    publicText:
      "Bring to mind one recurring hard moment — a meeting, a conversation, a pattern. Ask: whose voice am I repeating here? What am I actually protecting?",
    sourceWork: "The Birth of Business Genius",
    originalExercise: "Awareness Mapping",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.genius_golden_sphere",
    version: 1,
    modality: "mental",
    dimensions: ["genius"],
    publicText:
      "Picture yourself inside a small sphere of gold light, pulsing at the pace of a heartbeat. Don't ask it anything — just let it show you one thing, without words.",
    sourceWork: "Supraconscious: The Genius Within You",
    originalExercise: "Golden-ball visualization",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.genius_already_present",
    version: 1,
    modality: "mental",
    dimensions: ["genius"],
    publicText:
      "Finish this as if it's already true: act, speak, or decide today from the certainty that your Genius is already present — not something you're waiting to earn.",
    sourceWork: "The Birth of Business Genius",
    originalExercise: "365 Daily Frames of Thought",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.supraconscious_observer",
    version: 1,
    modality: "mental",
    dimensions: ["supraconscious"],
    publicText:
      "Picture someone watching this entire moment of your life from just behind your shoulder — calm, unhurried, incapable of judging you. What do they notice that you can't see from inside it?",
    sourceWork: "Supraconscious: The Genius Within You",
    originalExercise: "Observer Meditation",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.supraconscious_inner_dialogue",
    version: 1,
    modality: "mental",
    dimensions: ["supraconscious"],
    publicText:
      "Give your protective side one line to speak, and your tender side one line to answer it with. Let them finish each other's sentence.",
    sourceWork: "Not Mars. Not Venus. Just Us.",
    originalExercise: "Masculine/feminine inner-dialogue visualization",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.embodiment_wholeness_breath",
    version: 1,
    modality: "mental",
    dimensions: ["embodiment"],
    publicText:
      "Join your thumb and index finger on both hands, palms turned up. Breathe in for four counts, out for eight, eight times. Notice what settles by the last breath.",
    sourceWork: "Supraconscious: The Genius Within You",
    originalExercise: "Wholeness breathing meditation",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
  {
    key: "mental.embodiment_resilient_listening",
    version: 1,
    modality: "mental",
    dimensions: ["embodiment"],
    publicText:
      "Next time you're mid-conversation, try one full round: breathe once before you respond, don't prepare your reply while they're still talking, and reflect the feeling back before you share your own view.",
    sourceWork: "The Birth of Business Genius",
    originalExercise: "Moment-to-Moment Resilient Listening",
    approvalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
  },
] as const

const normalizedDecisionBrief = {
  lockedDoctrine: LOCKED_DOCTRINE,
  removedTerms: [
    "Inner Council",
    "Threshold",
    "Revelation",
    "Echo",
    "Witness",
    "Clear Mirror",
    "Reframer",
    "Inner Author",
  ],
  promptCount: CURATED_PROMPTS.length,
}

export const FOUNDER_CONTEXT_SOURCES: readonly FounderContextSource[] = [
  {
    key: "founder_decision_brief_v3",
    title: "Supraconscious Avatar AI — Founder Decision Brief (v3)",
    version: "3",
    precedence: 1,
    suppliedDate: "2026-07-30",
    registeredAt: "2026-07-30",
    registeredBy: "Carl Welch",
    suppliedBy: "Maria",
    changeReason: "Register Maria's final v3 confirmations as the highest-precedence doctrine source.",
    intendedUse: "product_doctrine",
    founderApprovalState: "founder_confirmed",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
    checksum: checksum(normalizedDecisionBrief),
    checksumScope: "normalized_registry_payload",
    supersedes: ["inner_council", "threshold", "revelation", "guide_persona_stages"],
  },
  {
    key: "physical_prompt_library_v1",
    title: "Physical Prompts for SupraAI — Aligned to Classic Acting Exercises",
    version: "1",
    precedence: 2,
    suppliedDate: "2026-07-30",
    registeredAt: "2026-07-30",
    registeredBy: "Carl Welch",
    suppliedBy: "Maria",
    changeReason: "Register the founder-supplied v1 physical prompt corpus without activating retrieval.",
    intendedUse: "curated_prompt_library",
    founderApprovalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
    checksum: checksum(CURATED_PROMPTS.filter((prompt) => prompt.modality === "physical")),
    checksumScope: "normalized_registry_payload",
    supersedes: ["generic_physical_wellness_prompts"],
  },
  {
    key: "mental_prompt_library_v1",
    title: "SupraAI — Mental Prompt Library (with Embodiment Companions)",
    version: "1",
    precedence: 3,
    suppliedDate: "2026-07-30",
    registeredAt: "2026-07-30",
    registeredBy: "Carl Welch",
    suppliedBy: "Maria",
    changeReason: "Register the founder-supplied v1 mental prompt corpus without activating retrieval.",
    intendedUse: "curated_prompt_library",
    founderApprovalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
    checksum: checksum(CURATED_PROMPTS.filter((prompt) => prompt.modality === "mental")),
    checksumScope: "normalized_registry_payload",
    supersedes: ["generic_ai_journaling_prompts"],
  },
  {
    key: "foundational_consciousness_architecture_v1",
    title: "Supraconscious Avatar AI — Foundational Consciousness Architecture",
    version: "1",
    precedence: 4,
    suppliedDate: "2026-07-30",
    registeredAt: "2026-07-30",
    registeredBy: "Carl Welch",
    suppliedBy: "Maria",
    changeReason: "Register the earlier architecture as reference-only where it does not conflict with later sources.",
    intendedUse: "reference_only",
    founderApprovalState: "founder_supplied",
    rightsState: "needs_legal_review",
    retrievalState: "blocked",
    checksum: "40f6c0d4f5cd27e88569747869a32e32ab7606d71da433b7b57bd5d91734577b",
    checksumScope: "source_artifact",
    supersedes: [],
  },
] as const

export function validateFounderContextRegistry() {
  const errors: string[] = []
  const sourceKeys = new Set(FOUNDER_CONTEXT_SOURCES.map((source) => source.key))
  const promptKeys = new Set(CURATED_PROMPTS.map((prompt) => prompt.key))
  const precedence = new Set(FOUNDER_CONTEXT_SOURCES.map((source) => source.precedence))
  const physicalCount = CURATED_PROMPTS.filter((prompt) => prompt.modality === "physical").length
  const mentalCount = CURATED_PROMPTS.filter((prompt) => prompt.modality === "mental").length

  if (sourceKeys.size !== 4 || FOUNDER_CONTEXT_SOURCES.length !== 4) {
    errors.push("founder_context_requires_four_unique_sources")
  }
  if (precedence.size !== 4) {
    errors.push("founder_context_precedence_must_be_unique")
  }
  if (promptKeys.size !== 24 || CURATED_PROMPTS.length !== 24) {
    errors.push("curated_prompt_library_requires_24_unique_prompts")
  }
  if (physicalCount !== 10 || mentalCount !== 14) {
    errors.push("curated_prompt_modality_counts_are_invalid")
  }

  for (const source of FOUNDER_CONTEXT_SOURCES) {
    if (!/^[a-f0-9]{64}$/.test(source.checksum)) {
      errors.push(`invalid_source_checksum:${source.key}`)
    }
    if (source.checksum !== FOUNDER_CONTEXT_APPROVED_CHECKSUMS[source.key]) {
      errors.push(`unreviewed_source_revision:${source.key}`)
    }
    if (source.rightsState !== "needs_legal_review" || source.retrievalState !== "blocked") {
      errors.push(`source_must_remain_non_retrievable:${source.key}`)
    }
    if (!source.registeredAt || !source.registeredBy || !source.changeReason) {
      errors.push(`source_audit_metadata_missing:${source.key}`)
    }
  }

  for (const prompt of CURATED_PROMPTS) {
    if (
      !prompt.publicText.trim() ||
      !prompt.sourceWork.trim() ||
      !prompt.originalExercise.trim() ||
      prompt.dimensions.length === 0
    ) {
      errors.push(`incomplete_prompt_metadata:${prompt.key}`)
    }
    if (
      prompt.approvalState !== "founder_supplied" ||
      prompt.rightsState !== "needs_legal_review" ||
      prompt.retrievalState !== "blocked"
    ) {
      errors.push(`prompt_must_remain_non_retrievable:${prompt.key}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    sourceCount: FOUNDER_CONTEXT_SOURCES.length,
    promptCount: CURATED_PROMPTS.length,
    physicalCount,
    mentalCount,
  }
}

function checksum(value: unknown) {
  return createHash("sha256").update(stableStringify(value)).digest("hex")
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right),
    )
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(",")}}`
  }
  return JSON.stringify(value)
}
