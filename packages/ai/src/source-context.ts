import { prisma } from "@inner-avatar/db"
import {
  evaluateSourceEligibility,
  parseAllowedUses,
  SOURCE_POLICY_VERSION,
  type SourcePolicyDecision,
} from "./source-policy.js"

export type SourceContextChunk = {
  id: string
  title: string
  text: string
}

export type CouncilRetrievedContext = SourceContextChunk & {
  sourceDocumentId: string
  rank: number
  score: number
  matchedTerms: string[]
  matchedFields: string[]
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
  options: { limit?: number; safetySeverity?: "none" | "low" | "medium" | "high" } = {},
): Promise<CouncilRetrievedContext[]> {
  const limit = options.limit ?? 4
  const where = buildApprovedSourceWhere(query)
  const terms = extractSearchTerms(query)

  const chunks = await prisma.sourceChunk.findMany({
    where,
    take: Math.max(limit * 4, limit),
    orderBy: [{ sourcePriority: "desc" }, { createdAt: "asc" }],
    include: {
      sourceDocument: {
        select: {
          id: true,
          title: true,
          rightsStatus: true,
          reviewState: true,
          rightsGrants: {
            select: {
              status: true,
              allowedUses: true,
              quoteAllowed: true,
              expiresAt: true,
              revokedAt: true,
            },
          },
        },
      },
    },
  })

  return chunks
    .map((chunk) => {
      const policy = evaluateSourceEligibility(chunk.sourceDocument, chunk, {
        safetySeverity: options.safetySeverity,
      })
      const score = scoreChunk(chunk, terms)
      return { chunk, policy, score }
    })
    .filter((item) => item.policy.eligible)
    .sort((left, right) =>
      right.score.score - left.score.score ||
      right.chunk.sourcePriority - left.chunk.sourcePriority ||
      left.chunk.createdAt.getTime() - right.chunk.createdAt.getTime(),
    )
    .slice(0, limit)
    .map(({ chunk, policy, score }, index) => toRetrievedContext(chunk, policy, score, index))
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
        revokedAt: null,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
        allowedUses: {
          array_contains: ["paraphrase_generation"],
        },
      },
    },
  }
}

export function extractSearchTerms(query: string) {
  const stopwords = new Set(["about", "after", "again", "being", "could", "every", "their", "there", "these", "those", "where", "which", "while", "would"])
  const normalized = query
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !stopwords.has(word))

  return Array.from(new Set(normalized)).slice(0, 6)
}

export function scoreSourceChunkForQuery(input: {
  chunkText: string
  quoteSafeExcerpt?: string | null
  conceptTags?: unknown
  councilRoleTags?: unknown
  sourcePriority?: number
}, terms: string[]) {
  return scoreChunk(input, terms)
}

function scoreChunk(
  chunk: {
    chunkText: string
    quoteSafeExcerpt?: string | null
    conceptTags?: unknown
    councilRoleTags?: unknown
    sourcePriority?: number
  },
  terms: string[],
) {
  const text = chunk.chunkText.toLowerCase()
  const quote = (chunk.quoteSafeExcerpt ?? "").toLowerCase()
  const conceptTags = parseAllowedUses(chunk.conceptTags).map((tag) => tag.toLowerCase())
  const roleTags = parseAllowedUses(chunk.councilRoleTags).map((tag) => tag.toLowerCase())
  const matchedTerms = terms.filter((term) => text.includes(term) || quote.includes(term) || conceptTags.includes(term) || roleTags.includes(term))
  const matchedFields = new Set<string>()
  let score = Math.max(0, chunk.sourcePriority ?? 0) * 0.01

  for (const term of terms) {
    const textMatches = countMatches(text, term)
    if (textMatches > 0) {
      matchedFields.add("chunkText")
      score += textMatches * 3
    }
    if (quote.includes(term)) {
      matchedFields.add("quoteSafeExcerpt")
      score += 2
    }
    if (conceptTags.includes(term)) {
      matchedFields.add("conceptTags")
      score += 5
    }
    if (roleTags.includes(term)) {
      matchedFields.add("councilRoleTags")
      score += 4
    }
  }

  return {
    score,
    matchedTerms,
    matchedFields: Array.from(matchedFields),
  }
}

function toRetrievedContext(
  chunk: {
    id: string
    sourceDocumentId: string
    chunkText: string
    quoteSafeExcerpt: string | null
    quotePermission: string
    sourceDocument: { id: string; title: string }
  },
  policy: SourcePolicyDecision,
  score: { score: number; matchedTerms: string[]; matchedFields: string[] },
  index: number,
): CouncilRetrievedContext {
  return {
    id: chunk.id,
    sourceDocumentId: chunk.sourceDocument.id,
    title: chunk.sourceDocument.title,
    text: chunk.chunkText.slice(0, 1200),
    rank: index + 1,
    score: Number(score.score.toFixed(3)),
    matchedTerms: score.matchedTerms,
    matchedFields: score.matchedFields,
    matchReason: score.matchedTerms.length ? `Matched terms: ${score.matchedTerms.join(", ")}` : "Approved source fallback",
    allowedUse: policy.canDisplayQuote ? "direct_quote_display" : "paraphrase_generation",
    quotePermission: chunk.quotePermission,
    sourcePolicyVersion: SOURCE_POLICY_VERSION,
    displayExcerpt: policy.canDisplayQuote ? chunk.quoteSafeExcerpt : null,
  }
}

function countMatches(value: string, term: string) {
  return value.split(term).length - 1
}
