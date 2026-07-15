import { readFile, readdir, stat } from "node:fs/promises"
import { basename, extname, relative, resolve } from "node:path"
import {
  completeSourceImportBatch,
  createSourceImportBatch,
  createSourceSectionWithChunks,
  registerSourceDocument,
  upsertSourceRightsGrant,
} from "./source-ingestion.js"
import {
  REASONING_SCOPES,
  SOURCE_TYPES,
  defaultReasoningScopeForSourceType,
  type ReasoningScope,
  type SourceType,
} from "./source-policy.js"

export const OBSIDIAN_IMPORT_FRONTMATTER_FLAG = "inner_avatar_import"
export const OBSIDIAN_IMPORT_PARSER_VERSION = "obsidian-vault-importer-v1"

export type ObsidianImportResult = {
  batchId: string
  sourceRoot: string
  imported: number
  skipped: number
  failed: number
  documents: Array<{
    path: string
    title: string
    sourceType: SourceType
    reasoningScope: ReasoningScope
    action: "imported"
  }>
  errors: Array<{ path: string; error: string }>
}

export type ParsedObsidianNote = {
  shouldImport: boolean
  frontmatter: Record<string, unknown>
  body: string
  title: string
  sourceType: SourceType
  reasoningScope: ReasoningScope
  author?: string
  work?: string
  language: string
  tags: string[]
  aliases: string[]
  wikiLinks: string[]
  markdownLinks: string[]
}

export async function importObsidianVault(vaultRoot: string): Promise<ObsidianImportResult> {
  const resolvedRoot = resolve(vaultRoot)
  const batch = await createSourceImportBatch({
    sourceRoot: resolvedRoot,
    parserVersion: OBSIDIAN_IMPORT_PARSER_VERSION,
    metadata: { source: "obsidian", optInFlag: OBSIDIAN_IMPORT_FRONTMATTER_FLAG },
  })

  const result: ObsidianImportResult = {
    batchId: batch.id,
    sourceRoot: resolvedRoot,
    imported: 0,
    skipped: 0,
    failed: 0,
    documents: [],
    errors: [],
  }

  const files = await listFiles(resolvedRoot)
  for (const filePath of files) {
    const relPath = relative(resolvedRoot, filePath)
    if (extname(filePath).toLowerCase() !== ".md") {
      result.skipped += 1
      continue
    }

    try {
      const text = await readFile(filePath, "utf8")
      const note = parseObsidianMarkdown(text, relPath)
      if (!note.shouldImport || !note.body.trim()) {
        result.skipped += 1
        continue
      }

      const document = await registerSourceDocument({
        title: note.title,
        author: note.author,
        work: note.work,
        sourceType: note.sourceType,
        reasoningScope: note.reasoningScope,
        filePath,
        importBatchId: batch.id,
        text: note.body,
        rightsStatus: "needs_review",
        reviewState: "parsed",
        metadata: {
          parser: OBSIDIAN_IMPORT_PARSER_VERSION,
          source: "obsidian",
          relativePath: relPath,
          tags: note.tags,
          aliases: note.aliases,
          wikiLinks: note.wikiLinks,
          markdownLinks: note.markdownLinks,
          frontmatter: note.frontmatter,
        },
      })
      await createSourceSectionWithChunks(document.id, {
        headingPath: [note.title],
        sectionType: "obsidian_note",
        canonicalText: note.body,
        reviewState: "parsed",
      }, 2200)
      await attachObsidianRights(document.id, note.author)

      result.imported += 1
      result.documents.push({
        path: relPath,
        title: document.title,
        sourceType: note.sourceType,
        reasoningScope: note.reasoningScope,
        action: "imported",
      })
    } catch (error) {
      result.failed += 1
      result.errors.push({
        path: relPath,
        error: error instanceof Error ? error.message : "Unknown import error",
      })
    }
  }

  await completeSourceImportBatch(batch.id, {
    importedCount: result.imported,
    skippedCount: result.skipped,
    failedCount: result.failed,
    errorLog: result.errors,
  })

  return result
}

export function parseObsidianMarkdown(text: string, relativePath = "note.md"): ParsedObsidianNote {
  const { frontmatter, body } = extractFrontmatter(text)
  const sourceType = readSourceType(frontmatter.sourceType ?? frontmatter.source_type)
  const reasoningScope = readReasoningScope(
    frontmatter.reasoningScope ?? frontmatter.reasoning_scope,
    defaultReasoningScopeForSourceType(sourceType),
  )
  const title = readString(frontmatter.title) ?? readMarkdownTitle(body) ?? basename(relativePath, extname(relativePath))
  const tags = normalizeStringArray(frontmatter.tags ?? frontmatter.tag)
  const aliases = normalizeStringArray(frontmatter.aliases ?? frontmatter.alias)

  return {
    shouldImport: frontmatter[OBSIDIAN_IMPORT_FRONTMATTER_FLAG] === true,
    frontmatter,
    body: body.trim(),
    title,
    sourceType,
    reasoningScope,
    author: readString(frontmatter.author),
    work: readString(frontmatter.work),
    language: readString(frontmatter.language) ?? "en",
    tags,
    aliases,
    wikiLinks: extractWikiLinks(body),
    markdownLinks: extractMarkdownLinks(body),
  }
}

function extractFrontmatter(text: string) {
  if (!text.startsWith("---\n") && !text.startsWith("---\r\n")) {
    return { frontmatter: {}, body: text }
  }

  const lineEnding = text.startsWith("---\r\n") ? "\r\n" : "\n"
  const closing = text.indexOf(`${lineEnding}---${lineEnding}`, 4)
  if (closing === -1) return { frontmatter: {}, body: text }

  const rawFrontmatter = text.slice(4, closing)
  const body = text.slice(closing + 3 + lineEnding.length * 2)
  return {
    frontmatter: parseSimpleFrontmatter(rawFrontmatter),
    body,
  }
}

function parseSimpleFrontmatter(raw: string): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  const lines = raw.split(/\r?\n/)

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? ""
    if (!line.trim() || line.trimStart().startsWith("#")) continue

    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(line)
    if (!match) continue

    const [, key, value] = match
    if (value === "") {
      const items: string[] = []
      while (index + 1 < lines.length && /^\s*-\s+/.test(lines[index + 1] ?? "")) {
        index += 1
        items.push(stripQuotes((lines[index] ?? "").replace(/^\s*-\s+/, "").trim()))
      }
      result[key] = items
      continue
    }

    result[key] = parseFrontmatterValue(value)
  }

  return result
}

function parseFrontmatterValue(value: string): unknown {
  const trimmed = value.trim()
  if (trimmed === "true") return true
  if (trimmed === "false") return false
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed
      .slice(1, -1)
      .split(",")
      .map((item) => stripQuotes(item.trim()))
      .filter(Boolean)
  }
  return stripQuotes(trimmed)
}

function stripQuotes(value: string) {
  if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
    return value.slice(1, -1)
  }
  return value
}

function readSourceType(value: unknown): SourceType {
  const text = readString(value)
  if (text && (SOURCE_TYPES as readonly string[]).includes(text)) return text as SourceType
  return "product_doctrine"
}

function readReasoningScope(value: unknown, fallback: ReasoningScope): ReasoningScope {
  const text = readString(value)
  if (text && (REASONING_SCOPES as readonly string[]).includes(text)) return text as ReasoningScope
  return fallback
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(new Set(value.map(readString).filter((item): item is string => Boolean(item))))
  }
  const text = readString(value)
  if (!text) return []
  return Array.from(new Set(text.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean)))
}

function readMarkdownTitle(body: string) {
  const match = /^#\s+(.+)$/m.exec(body)
  return match?.[1]?.trim()
}

function extractWikiLinks(body: string) {
  const links = new Set<string>()
  for (const match of body.matchAll(/\[\[([^\]|#]+)(?:#[^\]|]+)?(?:\|[^\]]+)?\]\]/g)) {
    const target = match[1]?.trim()
    if (target) links.add(target)
  }
  return Array.from(links).sort()
}

function extractMarkdownLinks(body: string) {
  const links = new Set<string>()
  for (const match of body.matchAll(/!?\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1]?.trim()
    if (target) links.add(target)
  }
  return Array.from(links).sort()
}

async function attachObsidianRights(sourceDocumentId: string, author?: string) {
  await upsertSourceRightsGrant({
    sourceDocumentId,
    ownerName: author ?? "Obsidian vault author",
    allowedUses: ["internal_retrieval", "paraphrase_generation"],
    quoteAllowed: false,
    status: "needs_review",
    reason: "Imported Obsidian source requires explicit rights review before retrieval or display.",
    metadata: { createdBy: OBSIDIAN_IMPORT_PARSER_VERSION },
  })
}

async function listFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true })
  const files = await Promise.all(entries.map(async (entry) => {
    const path = resolve(root, entry.name)
    if (entry.isDirectory()) return listFiles(path)
    if (!entry.isFile()) return []
    const stats = await stat(path)
    return stats.size > 0 ? [path] : []
  }))
  return files.flat().sort()
}
