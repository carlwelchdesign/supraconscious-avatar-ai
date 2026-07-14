import { hasUsableSourceRightsGrant } from "@inner-avatar/ai"

export type SourceReadinessGrant = {
  status: string
  allowedUses: unknown
  quoteAllowed: boolean
  expiresAt?: Date | string | null
  revokedAt?: Date | string | null
}

export type SourceReadinessChunk = {
  reviewState: string
  quotePermission: string
  safetyIntensity: string
}

export type SourceReadinessInput = {
  reviewState: string
  rightsStatus: string
  rightsGrants: SourceReadinessGrant[]
  chunks: SourceReadinessChunk[]
  _count: { chunks: number; sections: number }
}

export type SourceReadinessStatus =
  | "not_parsed"
  | "rights_pending"
  | "document_blocked"
  | "chunks_pending"
  | "ready_for_rag"

export function getSourceReadinessStatus(source: SourceReadinessInput): SourceReadinessStatus {
  if (source._count.sections === 0 || source._count.chunks === 0) return "not_parsed"
  if (!hasUsableSourceRightsGrant(source, "paraphrase_generation")) return "rights_pending"
  if (!["approved", "approved_curriculum"].includes(source.reviewState)) return "document_blocked"
  if (!["approved", "paraphrase_only"].includes(source.rightsStatus)) return "document_blocked"
  if (source.chunks.some((chunk) => !isRagReadyChunk(chunk))) return "chunks_pending"
  return "ready_for_rag"
}

export function isRagReadyChunk(chunk: SourceReadinessChunk) {
  return ["approved", "approved_curriculum"].includes(chunk.reviewState) &&
    ["paraphrase_only", "quote_safe"].includes(chunk.quotePermission) &&
    chunk.safetyIntensity !== "blocked"
}
