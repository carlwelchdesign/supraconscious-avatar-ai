import { readdir, stat } from "node:fs/promises"
import { extname, relative, resolve } from "node:path"
import {
  extractDocxParagraphs,
  importCurriculumDocx,
} from "./curriculum-docx.js"
import {
  completeSourceImportBatch,
  createSourceChunks,
  createSourceImportBatch,
  registerSourceDocument,
  upsertSourceRightsGrant,
} from "./source-ingestion.js"
import type { SourceType } from "./source-policy.js"

export type SourceImportResult = {
  batchId: string
  sourceRoot: string
  imported: number
  skipped: number
  failed: number
  documents: Array<{
    path: string
    title: string
    sourceType: SourceType
    action: "imported" | "registered"
    count?: number
  }>
  errors: Array<{ path: string; error: string }>
}

const MONTHLY_DIR_FRAGMENT = "YEARLY QUOTES"
const IMAGE_DIR_FRAGMENT = "AVATAR IMAGES"
const MANUSCRIPT_FRAGMENTS = ["BOOKS", "ORIGINAL MANUSCRIPTS"]

export async function importSourceCorpus(sourceRoot: string): Promise<SourceImportResult> {
  const resolvedRoot = resolve(sourceRoot)
  const batch = await createSourceImportBatch({
    sourceRoot: resolvedRoot,
    parserVersion: "source-import-runner-v1",
    metadata: { policy: "policy-first-rag" },
  })

  const result: SourceImportResult = {
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
    const ext = extname(filePath).toLowerCase()

    if (relPath.includes(".DS_Store") || ![".docx", ".pdf", ".png", ".jpg", ".jpeg"].includes(ext)) {
      result.skipped += 1
      continue
    }

    try {
      const classification = classifySourcePath(relPath)
      if (classification.sourceType === "curriculum" && ext === ".docx") {
        const imported = await importCurriculumDocx(filePath, {
          publishState: "needs_review",
          importBatchId: batch.id,
        })
        await attachDefaultRights(imported.document.id, classification.sourceType)
        result.imported += 1
        result.documents.push({
          path: relPath,
          title: imported.document.title,
          sourceType: classification.sourceType,
          action: "imported",
          count: imported.curriculumDays.length,
        })
        continue
      }

      if (classification.sourceType === "product_doctrine" && ext === ".docx") {
        const paragraphs = await extractDocxParagraphs(filePath)
        const text = paragraphs.join("\n")
        const document = await registerSourceDocument({
          title: classification.title,
          author: "Maria Olon Tsaroucha",
          sourceType: classification.sourceType,
          filePath,
          importBatchId: batch.id,
          text,
          rightsStatus: "needs_review",
          reviewState: "parsed",
          metadata: { parser: "source-import-runner-v1", relativePath: relPath },
        })
        await createSourceChunks(document.id, text, 2200)
        await attachDefaultRights(document.id, classification.sourceType)
        result.imported += 1
        result.documents.push({
          path: relPath,
          title: document.title,
          sourceType: classification.sourceType,
          action: "imported",
        })
        continue
      }

      const document = await registerSourceDocument({
        title: classification.title,
        author: classification.sourceType === "image" ? undefined : "Maria Olon Tsaroucha",
        sourceType: classification.sourceType,
        filePath,
        importBatchId: batch.id,
        rightsStatus: "needs_review",
        reviewState: classification.sourceType === "image" ? "needs_review" : "imported",
        metadata: { parser: "source-import-runner-v1", relativePath: relPath, extension: ext },
      })
      await attachDefaultRights(document.id, classification.sourceType)
      result.imported += 1
      result.documents.push({
        path: relPath,
        title: document.title,
        sourceType: classification.sourceType,
        action: "registered",
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

export function classifySourcePath(relativePath: string): { sourceType: SourceType; title: string } {
  const normalized = relativePath.normalize("NFKC")
  const fileName = normalized.split("/").at(-1) ?? normalized
  const title = fileName.replace(/\.(docx|pdf|png|jpe?g)$/i, "").trim()

  if (normalized.includes(MONTHLY_DIR_FRAGMENT)) {
    return { sourceType: "curriculum", title }
  }
  if (normalized.includes(IMAGE_DIR_FRAGMENT)) {
    return { sourceType: "image", title }
  }
  if (MANUSCRIPT_FRAGMENTS.some((fragment) => normalized.includes(fragment))) {
    return { sourceType: "manuscript", title }
  }
  if (/\.(docx)$/i.test(normalized)) {
    return { sourceType: "product_doctrine", title }
  }
  return { sourceType: "external", title }
}

async function attachDefaultRights(sourceDocumentId: string, sourceType: SourceType) {
  await upsertSourceRightsGrant({
    sourceDocumentId,
    ownerName: "Maria Olon Tsaroucha",
    allowedUses: sourceType === "image" ? ["internal_retrieval"] : ["internal_retrieval", "paraphrase_generation"],
    quoteAllowed: false,
    status: "needs_review",
    reason: "Imported source requires explicit rights review before retrieval or display.",
    metadata: { createdBy: "source-import-runner-v1" },
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
