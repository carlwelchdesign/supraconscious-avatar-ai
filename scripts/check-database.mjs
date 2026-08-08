import assert from "node:assert/strict"
import { readFileSync, readdirSync } from "node:fs"
import path from "node:path"
import {
  auditMigrationEntries,
  findMissingQueryIndexes,
  findUnindexedRelations,
  findUnsafeMoneyFloats,
  parsePrismaSchema,
} from "./lib/database-audit.mjs"

const root = process.cwd()
const schemaPath = path.join(root, "packages/db/prisma/schema.prisma")
const migrationsPath = path.join(root, "packages/db/prisma/migrations")
const schema = readFileSync(schemaPath, "utf8")

assert.match(schema, /provider\s*=\s*"postgresql"/, "the production datastore must remain PostgreSQL")

const models = parsePrismaSchema(schema)
assert.ok(models.size > 0, "the Prisma schema must contain models")

const unindexedRelations = findUnindexedRelations(models)
assert.deepEqual(unindexedRelations, [], `relation fields need an index or unique constraint: ${unindexedRelations.join(", ")}`)

const missingQueryIndexes = findMissingQueryIndexes(models)
assert.deepEqual(missingQueryIndexes, [], `query-backed indexes are missing: ${missingQueryIndexes.join(", ")}`)

const unsafeMoneyFloats = findUnsafeMoneyFloats(models)
assert.deepEqual(unsafeMoneyFloats, [], `money-like fields must use Decimal rather than Float: ${unsafeMoneyFloats.join(", ")}`)

const migrationEntries = readdirSync(migrationsPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => {
    const migrationPath = path.join(migrationsPath, entry.name, "migration.sql")
    try {
      return { name: entry.name, hasMigrationSql: true, migrationSql: readFileSync(migrationPath, "utf8") }
    } catch (error) {
      if (error?.code === "ENOENT") return { name: entry.name, hasMigrationSql: false, migrationSql: "" }
      throw error
    }
  })

const migrationErrors = auditMigrationEntries(migrationEntries)
assert.deepEqual(migrationErrors, [], `migration layout errors: ${migrationErrors.join(", ")}`)

const auditedMigration = readFileSync(
  path.join(migrationsPath, "20260808191500_database_audit_indexes/migration.sql"),
  "utf8",
)
assert.doesNotMatch(
  auditedMigration,
  /^\s*(?:DELETE|TRUNCATE|DROP\s+(?:TABLE|COLUMN))\b/im,
  "the audit migration must not delete rows, tables, or columns",
)
assert.equal(
  (auditedMigration.match(/^CREATE INDEX CONCURRENTLY/gm) ?? []).length,
  16,
  "all audited indexes must be created concurrently",
)

console.log(
  `Database audit passed: ${models.size} models, ${migrationEntries.length} migrations, relation indexes, query indexes, and money types verified.`,
)
