import assert from "node:assert/strict"
import test from "node:test"
import {
  auditMigrationEntries,
  findMissingQueryIndexes,
  findUnindexedRelations,
  findUnsafeMoneyFloats,
  parsePrismaSchema,
} from "./lib/database-audit.mjs"

test("recognizes relation indexes and composite query indexes", () => {
  const models = parsePrismaSchema(`
model Parent {
  id String @id
  children Child[]
}

model Child {
  id String @id
  parentId String
  createdAt DateTime
  parent Parent @relation(
    fields: [parentId],
    references: [id]
  )

  @@index([parentId, createdAt])
}
`)

  assert.deepEqual(findUnindexedRelations(models), [])
  assert.deepEqual(findMissingQueryIndexes(models, new Map([["Child", [["parentId", "createdAt"]]]])), [])
})

test("reports missing relation and required query indexes", () => {
  const models = parsePrismaSchema(`
model Child {
  id String @id
  parentId String
  createdAt DateTime
  parent Parent @relation(fields: [parentId], references: [id])
}
`)

  assert.deepEqual(findUnindexedRelations(models), ["Child.parentId"])
  assert.deepEqual(findMissingQueryIndexes(models, new Map([["Child", [["parentId", "createdAt"]]]])), [
    "Child(parentId, createdAt)",
  ])
})

test("rejects floating-point money fields without flagging bounded scores", () => {
  const models = parsePrismaSchema(`
model Metric {
  id String @id
  confidence Float
  totalScore Float
  totalAmount Float
}
`)

  assert.deepEqual(findUnsafeMoneyFloats(models), ["Metric.totalAmount"])
})

test("validates migration directory shape and content", () => {
  assert.deepEqual(
    auditMigrationEntries([{ name: "20260808191500_database_audit", hasMigrationSql: true, migrationSql: "SELECT 1;" }]),
    [],
  )

  assert.deepEqual(
    auditMigrationEntries([{ name: "database_audit", hasMigrationSql: false, migrationSql: "" }]),
    [
      "database_audit: migration directory must start with a 14-digit UTC timestamp",
      "database_audit: migration.sql is missing",
      "database_audit: migration.sql is empty",
    ],
  )
})
