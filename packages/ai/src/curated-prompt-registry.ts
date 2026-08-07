import { createHash } from "node:crypto"
import type { PrismaClient } from "@prisma/client"
import { prisma } from "@inner-avatar/db"
import {
  CURATED_PROMPTS,
  SUPRACONSCIOUS_DIMENSIONS,
  type FounderContextSourceKey,
  type SupraconsciousDimension,
} from "./founder-context-registry.js"
import { validatePublicCopyAgainstDoctrine } from "./doctrine-contract.js"

export const CURATED_PROMPT_REGISTRY_VERSION = "curated-prompt-registry-v1"

export const CURATED_PROMPT_PUBLIC_TEXT_CHECKSUMS = Object.freeze({
  "physical.release_into_body": "dec56cf25ff1d23b8ecd5a3a4e0f6e2839bcf44728fd06f1784f1672d8d68c2a",
  "physical.sensory_anchor": "10dd075e19521fb3cce63f050139f85e2046838d96e2b54479cf76e9abaa31b9",
  "physical.inner_map_return": "4bb8c2841648397bb278cfb1f764eeb1fe3c5e7996a19f902c6d93fb53553519",
  "physical.act_as_if": "581ff6926b97a1d8f8fa66552ddc145d68bd032cf1aef95c2ccd909b40c009eb",
  "physical.enter_frame": "f6097f5dc9d3fb3f33d439001b3aebe8ff7132ba160738efbd6c97e4b63a4e46",
  "physical.borrow_future_self": "3397a0965f9639be569319d42c141177b4d5fc5a9ec5a8b14e858d3a64a63e5a",
  "physical.unwitnessed_truth": "da05b629ff2b3a4bd2d64bdb202ec9cbf97c75f5838d7c2495b7b500e8bd5192",
  "physical.name_it_twice": "d5c1eac72cc27358a3d9b3716625e6c61819c1f2427c860e5256abe878403ab6",
  "physical.one_gesture": "9c518963237ab7be16f32925ae67160eaedf919ddb4afcea07eb140a6dae1609",
  "physical.narrow_frame": "503953e03442a76fae3d01f55358f22a7f1918fb8a0a6fd04053522914d7c12f",
  "mental.perception_projection": "3bda82d50eff8dd1ae786452d8bb6f8624c0ae2bdff88c15926a20a7e3630e3c",
  "mental.perception_wholeness": "0a4085806e8b5f5ae2e7b74a1a323aa24535d10d1bb5077bdceb70889f1bdaf9",
  "mental.story_identity_without_labels": "a3b50413e68f81b8ed272a507216564b1e1a8ee1a766684569d7e12d0c991469",
  "mental.story_braver_question": "88859dfa97da843096b38102bad514689a160848f4ba2709faabcbcf3a640c27",
  "mental.fear_unspoken_truth": "938f33b78dd4c7c9412c547540508c2a8525f0e5863733f51b05ed6270919aff",
  "mental.fear_language_shift": "7893c9ee50e56f4539c8ccad82da378c9c01889fb0c859a9e1717899b663d4d5",
  "mental.ego_persona": "f9ef6465e453041b789d6a5e47316f8c4ae946f55947000b9f5073f227b9ebdc",
  "mental.ego_repeated_voice": "93678d2dd928667ebbec19d5eb330ac2e2a8a0ee9a2379d03683e1d90f7cbfbb",
  "mental.genius_golden_sphere": "a752f645fe9c07fd9f6dcfc744f76bd326bebc0d36b3ef643847785d9877fde2",
  "mental.genius_already_present": "f53518b1af3294de01a1a5a09ae2fc20fc8e9c02bcb78ee3597adc69efc7b15f",
  "mental.supraconscious_observer": "07e060302a9af1c954fb110b28f8c21357ef2b2ea98479a77c74a0799342d05a",
  "mental.supraconscious_inner_dialogue": "435cabcbf6df5d476d632a9a7f9c561961dc4dd8a12b2b466b0a5351e5f6cfe6",
  "mental.embodiment_wholeness_breath": "1c59ff1f1080c650ed02c49ec60f3cf5652359d7993ab085181d8c70b4792ee3",
  "mental.embodiment_resilient_listening": "e07a266bb660ad973c5ce7eec27b4b27a96857ec50dce00026005c5408428b9b",
} as const)

type PromptModality = "physical" | "mental"
type RegistryClient = Pick<PrismaClient, "curatedPrompt" | "$transaction">

export type CuratedPromptRevisionInput = {
  stableKey: string
  publicTitle?: string
  publicText: string
  sourceWork: string
  originalExercise: string
  sourceLocator?: string
  dimensions: readonly SupraconsciousDimension[]
  modality: PromptModality
  language?: string
}

export function publicTextChecksum(publicText: string) {
  return createHash("sha256").update(publicText).digest("hex")
}

export function validateGovernedPromptRevision(input: CuratedPromptRevisionInput, version: number) {
  const errors: string[] = []
  const canonical = CURATED_PROMPTS.find((prompt) => prompt.key === input.stableKey)
  const knownDimensions = new Set<string>(SUPRACONSCIOUS_DIMENSIONS)

  if (!canonical) errors.push("stable_key_not_in_founder_registry")
  if (!Number.isInteger(version) || version < 1) errors.push("version_must_be_positive_integer")
  if (!input.publicText.trim()) errors.push("public_text_required")
  if (!input.sourceWork.trim()) errors.push("source_work_required")
  if (!input.originalExercise.trim()) errors.push("named_origin_required")
  if (input.dimensions.length === 0 || input.dimensions.some((dimension) => !knownDimensions.has(dimension))) {
    errors.push("valid_dimension_required")
  }
  if (canonical && input.modality !== canonical.modality) errors.push("modality_cannot_change")

  const copyCheck = validatePublicCopyAgainstDoctrine(
    [input.publicTitle, input.publicText].filter(Boolean).join("\n"),
  )
  if (!copyCheck.valid) errors.push(...copyCheck.issues.map((issue) => `public_copy:${issue}`))

  if (canonical && version === 1) {
    if (input.publicTitle !== canonical.publicTitle || input.publicText !== canonical.publicText) {
      errors.push("founder_v1_public_copy_must_be_exact")
    }
    if (
      input.sourceWork !== canonical.sourceWork ||
      input.originalExercise !== canonical.originalExercise ||
      input.dimensions.join(",") !== canonical.dimensions.join(",")
    ) {
      errors.push("founder_v1_provenance_must_be_exact")
    }
    const expected = CURATED_PROMPT_PUBLIC_TEXT_CHECKSUMS[input.stableKey as keyof typeof CURATED_PROMPT_PUBLIC_TEXT_CHECKSUMS]
    if (expected !== publicTextChecksum(input.publicText)) errors.push("founder_v1_public_copy_checksum_mismatch")
  }

  return { valid: errors.length === 0, errors }
}

export function validateCanonicalCuratedPromptRegistry() {
  const errors = CURATED_PROMPTS.flatMap((prompt) => {
    const result = validateGovernedPromptRevision(
      {
        stableKey: prompt.key,
        publicTitle: prompt.publicTitle,
        publicText: prompt.publicText,
        sourceWork: prompt.sourceWork,
        originalExercise: prompt.originalExercise,
        dimensions: prompt.dimensions,
        modality: prompt.modality,
      },
      prompt.version,
    )
    return result.errors.map((error) => `${prompt.key}:${error}`)
  })

  return { valid: errors.length === 0, errors, promptCount: CURATED_PROMPTS.length }
}

export async function listEligibleCuratedPrompts(
  input: {
    dimensions: readonly SupraconsciousDimension[]
    modality?: PromptModality
    language?: string
  },
  client: Pick<PrismaClient, "curatedPrompt"> = prisma,
) {
  if (input.dimensions.length === 0) return []

  const language = input.language ?? "en"
  const prompts = await client.curatedPrompt.findMany({
    where: {
      active: true,
      approvalState: "founder_approved",
      approvedById: { not: null },
      approvedAt: { not: null },
      rightsState: "approved",
      language,
      translationStatus: language === "en" ? "source" : "approved",
      modality: input.modality,
      dimensions: { some: { dimension: { in: [...input.dimensions] } } },
    },
    include: { dimensions: { orderBy: { dimension: "asc" } } },
    orderBy: [{ stableKey: "asc" }, { version: "desc" }],
  })

  return prompts.map(toPublicCuratedPrompt)
}

export function toPublicCuratedPrompt(prompt: {
  id: string
  stableKey: string
  version: number
  modality: string
  publicTitle: string | null
  publicText: string
  dimensions: Array<{ dimension: string }>
}) {
  return {
    id: prompt.id,
    stableKey: prompt.stableKey,
    version: prompt.version,
    modality: prompt.modality,
    title: prompt.publicTitle,
    text: prompt.publicText,
    dimensions: prompt.dimensions.map(({ dimension }) => dimension),
  }
}

export async function createCuratedPromptRevision(
  input: CuratedPromptRevisionInput,
  client: RegistryClient = prisma,
) {
  return client.$transaction(async (tx) => {
    const previous = await tx.curatedPrompt.findFirst({
      where: { stableKey: input.stableKey },
      orderBy: { version: "desc" },
    })
    if (!previous) throw new Error("Curated prompt stable key is not registered.")

    const version = previous.version + 1
    const validation = validateGovernedPromptRevision(input, version)
    if (!validation.valid) {
      throw new Error(`Curated prompt revision failed governance: ${validation.errors.join(", ")}`)
    }

    return tx.curatedPrompt.create({
      data: {
        stableKey: input.stableKey,
        version,
        modality: input.modality,
        publicTitle: input.publicTitle,
        publicText: input.publicText,
        internalTechniqueName: input.originalExercise,
        sourceDocumentId: previous.sourceDocumentId,
        sourceWork: input.sourceWork,
        sourceLocator: input.sourceLocator ?? previous.sourceLocator,
        rightsState: "needs_review",
        approvalState: "pending",
        safetyIntensity: previous.safetyIntensity,
        contraindications: previous.contraindications ?? undefined,
        language: input.language ?? previous.language,
        translationStatus: (input.language ?? previous.language) === "en" ? "source" : "pending",
        active: false,
        dimensions: { create: input.dimensions.map((dimension) => ({ dimension })) },
      },
      include: { dimensions: true },
    })
  })
}

export function sourceRegistryKeyForModality(modality: PromptModality): FounderContextSourceKey {
  return modality === "physical" ? "physical_prompt_library_v1" : "mental_prompt_library_v1"
}
