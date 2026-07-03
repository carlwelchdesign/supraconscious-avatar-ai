import { createHash } from "node:crypto"
import type { Prisma } from "@prisma/client"
import { prisma } from "@inner-avatar/db"

export type SourceDocumentInput = {
  title: string
  author?: string
  work?: string
  sourceType: "manuscript" | "curriculum" | "product_doctrine" | "image" | "external"
  filePath?: string
  text?: string
  rightsStatus?: string
  reviewState?: string
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
      rightsStatus: input.rightsStatus ?? "needs_review",
      reviewState: input.reviewState ?? "imported",
      metadata: toJson(input.metadata),
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
