import { createHash } from "node:crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "@inner-avatar/db"
import {
  SOURCE_POLICY_VERSION,
  SourceRightsGrantInputSchema,
  type SourceType,
} from "./source-policy.js"

export type SourceDocumentInput = {
  title: string
  author?: string
  work?: string
  sourceType: SourceType
  filePath?: string
  text?: string
  rightsStatus?: string
  reviewState?: string
  importBatchId?: string
  metadata?: Record<string, unknown>
}

export type CurriculumDayInput = {
  month: number
  day: number
  theme: string
  title?: string
  quote?: string
  frameOfThought: string
  socraticQuestion: string
  publishState?: string
  metadata?: Record<string, unknown>
}

export type SourceImportBatchInput = {
  sourceRoot: string
  parserVersion?: string
  initiatedById?: string | null
  metadata?: Record<string, unknown>
}

export type SourceRightsGrantInput = {
  sourceDocumentId: string
  ownerName: string
  grantType?: string
  allowedUses: string[]
  quoteAllowed?: boolean
  attributionRequired?: boolean
  attributionText?: string
  status?: string
  reviewerId?: string | null
  reason: string
  metadata?: Record<string, unknown>
}

export async function createSourceImportBatch(input: SourceImportBatchInput) {
  return prisma.sourceImportBatch.create({
    data: {
      sourceRoot: input.sourceRoot,
      parserVersion: input.parserVersion ?? SOURCE_POLICY_VERSION,
      initiatedById: input.initiatedById ?? null,
      metadata: toJson(input.metadata),
    },
  })
}

export async function completeSourceImportBatch(
  id: string,
  counts: { importedCount: number; skippedCount: number; failedCount: number; errorLog?: unknown[] },
) {
  return prisma.sourceImportBatch.update({
    where: { id },
    data: {
      importedCount: counts.importedCount,
      skippedCount: counts.skippedCount,
      failedCount: counts.failedCount,
      status: counts.failedCount > 0 ? "partial" : "completed",
      errorLog: counts.errorLog ? toJsonArray(counts.errorLog) : undefined,
      completedAt: new Date(),
    },
  })
}

export async function registerSourceDocument(input: SourceDocumentInput) {
  const checksum = buildChecksum(input)

  return prisma.sourceDocument.upsert({
    where: { checksum },
    create: {
      title: input.title,
      author: input.author,
      work: input.work,
      sourceType: input.sourceType,
      filePath: input.filePath,
      importBatchId: input.importBatchId,
      checksum,
      rightsStatus: input.rightsStatus ?? "needs_review",
      reviewState: input.reviewState ?? "imported",
      metadata: toJson(input.metadata),
    },
    update: {
      title: input.title,
      author: input.author,
      work: input.work,
      sourceType: input.sourceType,
      filePath: input.filePath,
      importBatchId: input.importBatchId,
      rightsStatus: input.rightsStatus ?? "needs_review",
      reviewState: input.reviewState ?? "imported",
      metadata: toJson(input.metadata),
    },
  })
}

export async function upsertSourceRightsGrant(input: SourceRightsGrantInput) {
  const parsed = SourceRightsGrantInputSchema.parse({
    ownerName: input.ownerName,
    grantType: input.grantType ?? "provided_by_owner",
    allowedUses: input.allowedUses,
    quoteAllowed: input.quoteAllowed ?? false,
    attributionRequired: input.attributionRequired ?? false,
    attributionText: input.attributionText,
    status: input.status ?? "needs_review",
    reason: input.reason,
  })

  const existing = await prisma.sourceRightsGrant.findFirst({
    where: {
      sourceDocumentId: input.sourceDocumentId,
      ownerName: parsed.ownerName,
      grantType: parsed.grantType,
    },
  })

  const data = {
    ownerName: parsed.ownerName,
    grantType: parsed.grantType,
    allowedUses: parsed.allowedUses,
    quoteAllowed: parsed.quoteAllowed,
    attributionRequired: parsed.attributionRequired,
    attributionText: parsed.attributionText,
    status: parsed.status,
    reviewerId: input.reviewerId ?? null,
    reviewedAt: input.reviewerId ? new Date() : null,
    reason: parsed.reason,
    metadata: toJson(input.metadata),
  }

  if (existing) {
    return prisma.sourceRightsGrant.update({
      where: { id: existing.id },
      data,
    })
  }

  return prisma.sourceRightsGrant.create({
    data: {
      sourceDocumentId: input.sourceDocumentId,
      ...data,
    },
  })
}

export async function createSourceChunks(sourceDocumentId: string, text: string, chunkSize = 2800) {
  const chunks = splitIntoChunks(text, chunkSize)

  await prisma.sourceChunk.deleteMany({ where: { sourceDocumentId } })

  return Promise.all(
    chunks.map((chunkText, index) =>
      prisma.sourceChunk.create({
        data: {
          sourceDocumentId,
          chunkText,
          quoteSafeExcerpt: chunkText.slice(0, 240),
          tokenCount: Math.ceil(chunkText.length / 4),
          chunkKind: "semantic",
          sourcePriority: chunks.length - index,
          reviewState: "parsed",
        },
      }),
    ),
  )
}

export async function upsertCurriculumDay(sourceDocumentId: string | null, input: CurriculumDayInput) {
  return prisma.curriculumDay.upsert({
    where: {
      month_day: {
        month: input.month,
        day: input.day,
      },
    },
    create: {
      sourceDocumentId,
      month: input.month,
      day: input.day,
      theme: input.theme,
      title: input.title,
      quote: input.quote,
      frameOfThought: input.frameOfThought,
      socraticQuestion: input.socraticQuestion,
      publishState: input.publishState ?? "needs_review",
      metadata: toJson(input.metadata),
    },
    update: {
      sourceDocumentId,
      theme: input.theme,
      title: input.title,
      quote: input.quote,
      frameOfThought: input.frameOfThought,
      socraticQuestion: input.socraticQuestion,
      publishState: input.publishState ?? "needs_review",
      metadata: toJson(input.metadata),
    },
  })
}

function buildChecksum(input: SourceDocumentInput) {
  return createHash("sha256")
    .update(JSON.stringify({
      title: input.title,
      filePath: input.filePath,
      text: input.text ?? "",
      sourceType: input.sourceType,
    }))
    .digest("hex")
}

function splitIntoChunks(text: string, chunkSize: number) {
  const normalized = text.replace(/\s+/g, " ").trim()
  if (!normalized) return []

  const chunks: string[] = []
  for (let index = 0; index < normalized.length; index += chunkSize) {
    chunks.push(normalized.slice(index, index + chunkSize).trim())
  }

  return chunks
}

function toJson(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  return value as Prisma.InputJsonValue | undefined
}

function toJsonArray(value: unknown[]): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue
}
