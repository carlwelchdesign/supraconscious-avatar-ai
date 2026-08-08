const MODEL_PATTERN = /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g

export const REQUIRED_QUERY_INDEXES = new Map([
  ["Session", [["userId", "lastSeenAt"]]],
  ["JournalEntry", [["userId", "createdAt"]]],
  ["PatternMemory", [["userId", "active"]]],
  ["CouncilSession", [["userId", "createdAt"]]],
  ["ConsentEvent", [["userId", "consentType", "createdAt"]]],
  ["CurriculumDay", [["month", "publishState", "day"]]],
  ["GenerationTrace", [["councilSessionId", "traceType", "createdAt"]]],
  ["SafetyEvent", [["reviewStatus", "createdAt"]]],
  ["Subscription", [["userId", "updatedAt"]]],
])

function parseFieldList(value) {
  return value
    .split(",")
    .map((field) => field.trim().replace(/\(.*/, ""))
    .filter(Boolean)
}

function hasPrefix(index, fields) {
  return fields.every((field, indexPosition) => index[indexPosition] === field)
}

export function parsePrismaSchema(source) {
  const models = new Map()

  for (const match of source.matchAll(MODEL_PATTERN)) {
    const [, name, body] = match
    const indexes = []
    const relations = []
    const fields = []

    for (const relation of body.matchAll(/@relation\([^)]*fields:\s*\[([^\]]+)\][^)]*\)/g)) {
      relations.push(parseFieldList(relation[1]))
    }

    for (const rawLine of body.split(/\r?\n/)) {
      const line = rawLine.trim()
      const blockIndex = line.match(/^@@(?:index|unique)\(\[([^\]]+)\]/)
      if (blockIndex) {
        indexes.push(parseFieldList(blockIndex[1]))
        continue
      }

      if (!line || line.startsWith("//") || line.startsWith("@@")) continue
      const field = line.match(/^(\w+)\s+(\w+)(\?|\[\])?\s*(.*)$/)
      if (!field) continue

      const [, fieldName, type, modifier = "", attributes] = field
      fields.push({ name: fieldName, type, optional: modifier === "?", list: modifier === "[]", attributes })
      if (/\s@(?:id|unique)(?:\s|$)/.test(` ${attributes}`)) {
        indexes.push([fieldName])
      }
    }

    models.set(name, { name, fields, indexes, relations })
  }

  return models
}

export function findUnindexedRelations(models) {
  const missing = []

  for (const model of models.values()) {
    for (const relationFields of model.relations) {
      if (!model.indexes.some((index) => hasPrefix(index, relationFields))) {
        missing.push(`${model.name}.${relationFields.join("+")}`)
      }
    }
  }

  return missing
}

export function findMissingQueryIndexes(models, requiredIndexes = REQUIRED_QUERY_INDEXES) {
  const missing = []

  for (const [modelName, indexes] of requiredIndexes) {
    const model = models.get(modelName)
    if (!model) {
      missing.push(`${modelName} (model missing)`)
      continue
    }

    for (const required of indexes) {
      if (!model.indexes.some((index) => hasPrefix(index, required))) {
        missing.push(`${modelName}(${required.join(", ")})`)
      }
    }
  }

  return missing
}

export function findUnsafeMoneyFloats(models) {
  const moneyName = /(?:^|_)(?:amount|balance|cost|fee|money|price|revenue|subtotal|tax|total)$|(?:Amount|Balance|Cost|Fee|Money|Price|Revenue|Subtotal|Tax|Total)$/
  const unsafe = []

  for (const model of models.values()) {
    for (const field of model.fields) {
      if (field.type === "Float" && moneyName.test(field.name)) {
        unsafe.push(`${model.name}.${field.name}`)
      }
    }
  }

  return unsafe
}

export function auditMigrationEntries(entries) {
  const errors = []
  const timestamps = new Set()

  for (const entry of entries) {
    const match = entry.name.match(/^(\d{14})_[a-z0-9_]+$/)
    if (!match) errors.push(`${entry.name}: migration directory must start with a 14-digit UTC timestamp`)
    if (match && timestamps.has(match[1])) errors.push(`${entry.name}: duplicate migration timestamp ${match[1]}`)
    if (match) timestamps.add(match[1])
    if (!entry.hasMigrationSql) errors.push(`${entry.name}: migration.sql is missing`)
    if (entry.migrationSql.trim().length === 0) errors.push(`${entry.name}: migration.sql is empty`)
  }

  return errors
}
