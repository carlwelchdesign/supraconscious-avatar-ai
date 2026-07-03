import { prisma } from "@inner-avatar/db"
import { SOURCE_POLICY_VERSION } from "./source-policy.js"

export type SourceContextChunk = {
  id: string
  title: string
  text: string
}

export type CouncilRetrievedContext = SourceContextChunk & {
  sourceDocumentId: string
  rank: number
  matchReason: string
  allowedUse: "paraphrase_generation" | "direct_quote_display"
  quotePermission: string
  sourcePolicyVersion: string
  displayExcerpt: string | null
}

export async function getApprovedSourceContext(query: string, limit = 4): Promise<SourceContextChunk[]> {
  const chunks = await retrieveCouncilContext(query, { limit })
  return chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.title,
    text: chunk.text,
  }))
}

export async function retrieveCouncilContext(
  query: string,
  options: { limit?: number } = {},
): Promise<CouncilRetrievedContext[]> {
  const limit = options.limit ?? 4
  const where = buildApprovedSourceWhere(query)
  const terms = extractSearchTerms(query)

  const chunks = await prisma.sourceChunk.findMany({
    where,
    take: limit,
    orderBy: [{ sourcePriority: "desc" }, { createdAt: "asc" }],
    include: {
      sourceDocument: {
        select: {
          id: true,
          title: true,
          rightsStatus: true,
          reviewState: true,
        },
      },
    },
  })

  return chunks.map((chunk, index) => ({
    id: chunk.id,
    sourceDocumentId: chunk.sourceDocument.id,
    title: chunk.sourceDocument.title,
    text: chunk.chunkText.slice(0, 1200),
    rank: index + 1,
    matchReason: terms.length ? `Matched terms: ${terms.join(", ")}` : "Approved source fallback",
    allowedUse: chunk.quotePermission === "quote_safe" && chunk.quoteSafeExcerpt
      ? "direct_quote_display"
      : "paraphrase_generation",
    quotePermission: chunk.quotePermission,
    sourcePolicyVersion: SOURCE_POLICY_VERSION,
    displayExcerpt: chunk.quotePermission === "quote_safe" ? chunk.quoteSafeExcerpt : null,
  }))
}

export function buildApprovedSourceWhere(query: string) {
  const terms = extractSearchTerms(query)
  return terms.length
    ? {
        reviewState: { in: ["approved", "approved_curriculum"] },
        safetyIntensity: { not: "blocked" },
        sourceDocument: buildApprovedDocumentWhere(),
        OR: terms.map((term) => ({
          chunkText: { contains: term, mode: "insensitive" as const },
        })),
      }
    : {
        reviewState: { in: ["approved", "approved_curriculum"] },
        safetyIntensity: { not: "blocked" },
        sourceDocument: buildApprovedDocumentWhere(),
      }
}

export function buildApprovedDocumentWhere() {
  return {
    reviewState: { in: ["approved", "approved_curriculum"] },
    rightsStatus: { in: ["approved", "paraphrase_only"] },
    rightsGrants: {
      some: {
        status: { in: ["approved", "paraphrase_only"] },
        allowedUses: {
          array_contains: ["paraphrase_generation"],
        },
      },
    },
  }
}

export function extractSearchTerms(query: string) {
  const normalized = query
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 5)

  return Array.from(new Set(normalized)).slice(0, 6)
}
