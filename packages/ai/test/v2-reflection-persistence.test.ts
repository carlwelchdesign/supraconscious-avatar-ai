import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const schema = readFileSync(resolve(repoRoot, "packages/db/prisma/schema.prisma"), "utf8")
const migration = readFileSync(
  resolve(repoRoot, "packages/db/prisma/migrations/20260807023000_v2_reflection_persistence/migration.sql"),
  "utf8",
)
const rollback = readFileSync(
  resolve(repoRoot, "packages/db/prisma/migrations/20260807023000_v2_reflection_persistence/rollback.sql"),
  "utf8",
)

test("v2 persistence models selected dimensions separately from legacy council records", () => {
  for (const model of [
    "ReflectionSession",
    "DimensionReflection",
    "GuideSynthesis",
    "ReflectionCapacityProfile",
    "ReflectionCorrection",
    "DoctrineVersion",
    "CuratedPrompt",
    "CuratedPromptDimension",
    "CuratedPromptAssignment",
  ]) {
    assert.match(schema, new RegExp(`model ${model} \\{`))
  }

  assert.match(schema, /@@unique\(\[reflectionSessionId, dimension\]\)/)
  assert.match(schema, /@@unique\(\[reflectionSessionId, displayOrder\]\)/)
  assert.match(schema, /model CouncilSession \{/)
  assert.match(schema, /model CouncilMessage \{/)
  assert.match(schema, /model CouncilSynthesis \{/)
})

test("v2 migration is additive and never reinterprets legacy records", () => {
  for (const legacyTable of [
    "CouncilSession",
    "CouncilMessage",
    "CouncilSynthesis",
    "GeneratedPrompt",
    "AvatarStageConfig",
  ]) {
    assert.equal(migration.includes(`DROP TABLE \"${legacyTable}\"`), false)
    assert.equal(migration.includes(`ALTER TABLE \"${legacyTable}\"`), false)
    assert.equal(migration.includes(`UPDATE \"${legacyTable}\"`), false)
  }

  assert.match(migration, /CREATE TABLE "ReflectionSession"/)
  assert.match(migration, /CREATE TABLE "DimensionReflection"/)
  assert.match(migration, /ON DELETE CASCADE/)
})

test("v2 rollback removes only additive persistence surfaces", () => {
  assert.match(rollback, /DROP TABLE IF EXISTS "ReflectionSession"/)
  assert.match(rollback, /DROP COLUMN IF EXISTS "reflectionSessionId"/)

  for (const legacyTable of ["CouncilSession", "CouncilMessage", "CouncilSynthesis", "GeneratedPrompt"]) {
    assert.equal(rollback.includes(`DROP TABLE IF EXISTS \"${legacyTable}\"`), false)
  }
})

test("prompt provenance remains queryable across source, dimension, modality, approval, and version", () => {
  assert.match(schema, /sourceDocumentId\s+String\?/)
  assert.match(schema, /@@index\(\[dimension\]\)/)
  assert.match(schema, /@@index\(\[modality\]\)/)
  assert.match(schema, /@@index\(\[approvalState\]\)/)
  assert.match(schema, /@@unique\(\[stableKey, version\]\)/)
})
