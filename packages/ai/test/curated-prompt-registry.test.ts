import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import {
  CURATED_PROMPTS,
  CURATED_PROMPT_PUBLIC_TEXT_CHECKSUMS,
  createCuratedPromptRevision,
  listEligibleCuratedPrompts,
  publicTextChecksum,
  validateCanonicalCuratedPromptRegistry,
  validateGovernedPromptRevision,
} from "../src/index.js"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const migration = readFileSync(
  resolve(repoRoot, "packages/db/prisma/migrations/20260807030000_seed_governed_prompt_registry/migration.sql"),
  "utf8",
)

test("canonical curated prompt registry locks all 24 founder-supplied public texts by checksum", () => {
  const result = validateCanonicalCuratedPromptRegistry()

  assert.equal(result.valid, true, result.errors.join(", "))
  assert.equal(result.promptCount, 24)
  assert.equal(Object.keys(CURATED_PROMPT_PUBLIC_TEXT_CHECKSUMS).length, 24)
  for (const prompt of CURATED_PROMPTS) {
    assert.equal(
      publicTextChecksum(prompt.publicText),
      CURATED_PROMPT_PUBLIC_TEXT_CHECKSUMS[prompt.key],
      prompt.key,
    )
  }
})

test("governance rejects unregistered generic wellness additions and v1 copy drift", () => {
  const generic = validateGovernedPromptRevision(
    {
      stableKey: "generic.daily_wellness",
      publicTitle: "Daily wellness",
      publicText: "Take a breath and think of something positive.",
      sourceWork: "Generic wellness",
      originalExercise: "Generic breathing",
      dimensions: ["embodiment"],
      modality: "mental",
    },
    1,
  )
  assert.equal(generic.valid, false)
  assert.equal(generic.errors.includes("stable_key_not_in_founder_registry"), true)

  const canonical = CURATED_PROMPTS[0]
  assert.ok(canonical)
  const drifted = validateGovernedPromptRevision(
    {
      stableKey: canonical.key,
      publicTitle: canonical.publicTitle,
      publicText: `${canonical.publicText} Breathe deeply.`,
      sourceWork: canonical.sourceWork,
      originalExercise: canonical.originalExercise,
      dimensions: canonical.dimensions,
      modality: canonical.modality,
    },
    1,
  )
  assert.equal(drifted.valid, false)
  assert.equal(drifted.errors.includes("founder_v1_public_copy_must_be_exact"), true)
  assert.equal(drifted.errors.includes("founder_v1_public_copy_checksum_mismatch"), true)
})

test("runtime eligibility requires active founder approval, rights clearance, and an intersecting dimension", async () => {
  let where: Record<string, unknown> | undefined
  const results = await listEligibleCuratedPrompts(
    { dimensions: ["story"], modality: "mental" },
    {
      curatedPrompt: {
        findMany: async (args: { where: Record<string, unknown> }) => {
          where = args.where
          return [{
            id: "prompt-1",
            stableKey: "mental.story_braver_question",
            version: 1,
            modality: "mental",
            publicTitle: null,
            publicText: "Public text",
            internalTechniqueName: "must stay private",
            sourceWork: "must stay private",
            dimensions: [{ dimension: "story" }],
          }]
        },
      },
    } as any,
  )

  assert.deepEqual(where, {
    active: true,
    approvalState: "founder_approved",
    approvedById: { not: null },
    approvedAt: { not: null },
    rightsState: "approved",
    language: "en",
    translationStatus: "source",
    modality: "mental",
    dimensions: { some: { dimension: { in: ["story"] } } },
  })
  assert.deepEqual(results, [{
    id: "prompt-1",
    stableKey: "mental.story_braver_question",
    version: 1,
    modality: "mental",
    title: null,
    text: "Public text",
    dimensions: ["story"],
  }])
  assert.equal("internalTechniqueName" in (results[0] ?? {}), false)
  assert.equal("sourceWork" in (results[0] ?? {}), false)
})

test("prompt edits create an inactive pending revision without mutating prior provenance", async () => {
  const calls: Array<{ operation: string; args: Record<string, unknown> }> = []
  const previous = {
    id: "prompt-v1",
    stableKey: "mental.story_braver_question",
    version: 1,
    sourceDocumentId: "source-1",
    sourceLocator: "registry:mental_prompt_library_v1",
    safetyIntensity: "low",
    contraindications: [],
    language: "en",
  }
  const tx = {
    curatedPrompt: {
      findFirst: async (args: Record<string, unknown>) => {
        calls.push({ operation: "find", args })
        return previous
      },
      create: async (args: Record<string, unknown>) => {
        calls.push({ operation: "create", args })
        return args.data
      },
    },
  }
  const client = { $transaction: async (run: (value: typeof tx) => Promise<unknown>) => run(tx) } as any

  const canonical = CURATED_PROMPTS.find((prompt) => prompt.key === previous.stableKey)
  assert.ok(canonical)
  const created = await createCuratedPromptRevision({
    stableKey: canonical.key,
    publicTitle: canonical.publicTitle,
    publicText: "What changes when you ask the braver version of this question?",
    sourceWork: canonical.sourceWork,
    originalExercise: canonical.originalExercise,
    dimensions: canonical.dimensions,
    modality: canonical.modality,
  }, client) as Record<string, unknown>

  assert.equal(calls.some((call) => call.operation === "create"), true)
  assert.equal(created.version, 2)
  assert.equal(created.approvalState, "pending")
  assert.equal(created.rightsState, "needs_review")
  assert.equal(created.active, false)
  assert.equal(created.sourceDocumentId, "source-1")
  assert.equal(created.sourceLocator, "registry:mental_prompt_library_v1")
})

test("data migration seeds only inactive founder-supplied revisions with exact two-track counts", () => {
  assert.match(migration, /CuratedPrompt_revision_immutable/)
  assert.match(migration, /CuratedPromptDimension_revision_immutable/)
  assert.match(migration, /Curated prompt content and provenance are immutable; create a new version/)
  assert.match(migration, /activation requires recorded founder approval, rights clearance, and dimensions/)
  assert.match(migration, /NEW\."approvalState" := 'approval_revoked'/)
  assert.match(migration, /exact_match_count <> 24/)
  assert.match(migration, /physical_count <> 10 OR mental_count <> 14/)
  assert.match(migration, /'founder_supplied'/)
  assert.match(migration, /'needs_legal_review'/)
  assert.match(migration, /'source', false/)

  const sqlLiteral = (value: string) => `'${value.replaceAll("'", "''")}'`
  for (const prompt of CURATED_PROMPTS) {
    assert.equal(migration.includes(sqlLiteral(prompt.key)), true, prompt.key)
    assert.equal(migration.includes(sqlLiteral(prompt.publicText)), true, prompt.key)
    assert.equal(migration.includes(sqlLiteral(prompt.sourceWork)), true, prompt.key)
    assert.equal(migration.includes(sqlLiteral(prompt.originalExercise)), true, prompt.key)
    assert.equal(migration.includes(sqlLiteral(JSON.stringify(prompt.dimensions))), true, prompt.key)
  }
})
