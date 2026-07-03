import { prisma } from "@inner-avatar/db"

export type SourceContextChunk = {
  id: string
  title: string
  text: string
}

export async function getApprovedSourceContext(query: string, limit = 4): Promise<SourceContextChunk[]> {
  const where = buildApprovedSourceWhere(query)

  const chunks = await prisma.sourceChunk.findMany({
    where,
    take: limit,
    orderBy: [{ sourcePriority: "desc" }, { createdAt: "asc" }],
    include: { sourceDocument: { select: { title: true } } },
  })

  return chunks.map((chunk) => ({
    id: chunk.id,
    title: chunk.sourceDocument.title,
    text: chunk.chunkText.slice(0, 1200),
  }))
}

export function buildApprovedSourceWhere(query: string) {
  const terms = extractSearchTerms(query)
  return terms.length
    ? {
        reviewState: { in: ["approved", "approved_curriculum"] },
        OR: terms.map((term) => ({
          chunkText: { contains: term, mode: "insensitive" as const },
        })),
      }
    : {
        reviewState: { in: ["approved", "approved_curriculum"] },
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
