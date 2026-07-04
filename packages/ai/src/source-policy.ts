import { z } from "zod"

export const SOURCE_POLICY_VERSION = "source-policy-v1"

export const SOURCE_REVIEW_STATES = [
  "imported",
  "parsed",
  "needs_review",
  "approved",
  "approved_curriculum",
  "deprecated",
  "blocked",
] as const

export const SOURCE_RIGHTS_STATES = [
  "needs_review",
  "approved",
  "paraphrase_only",
  "revoked",
  "expired",
  "blocked",
] as const

export const QUOTE_PERMISSIONS = [
  "none",
  "paraphrase_only",
  "quote_safe",
] as const

export const SOURCE_ALLOWED_USES = [
  "internal_retrieval",
  "paraphrase_generation",
  "direct_quote_display",
  "curriculum_display",
] as const

export const SOURCE_TYPES = [
  "manuscript",
  "curriculum",
  "product_doctrine",
  "image",
  "external",
] as const

export const CONTENT_DOMAINS = [
  "inner_council",
  "embodiment_gate",
  "becoming_loop",
  "supraconsciousness",
  "relationships",
  "business_genius",
  "daily_curriculum",
  "avatar_assets",
] as const

export const SAFETY_INTENSITIES = ["normal", "gentle", "sensitive", "blocked"] as const

export const COUNCIL_ROLE_TAGS = [
  "protector",
  "conditioned_self",
  "visionary",
  "truth_self",
  "integrator",
] as const

export const SourceReviewStateSchema = z.enum(SOURCE_REVIEW_STATES)
export const SourceRightsStateSchema = z.enum(SOURCE_RIGHTS_STATES)
export const QuotePermissionSchema = z.enum(QUOTE_PERMISSIONS)
export const SourceTypeSchema = z.enum(SOURCE_TYPES)
export const SourceAllowedUseSchema = z.enum(SOURCE_ALLOWED_USES)
export const SafetyIntensitySchema = z.enum(SAFETY_INTENSITIES)

export const SourceRightsGrantInputSchema = z.object({
  ownerName: z.string().trim().min(2),
  grantType: z.string().trim().min(2).default("provided_by_owner"),
  allowedUses: z.array(SourceAllowedUseSchema).min(1),
  quoteAllowed: z.boolean().default(false),
  attributionRequired: z.boolean().default(false),
  attributionText: z.string().trim().optional(),
  status: SourceRightsStateSchema.default("needs_review"),
  reason: z.string().trim().min(10),
})

export type SourceReviewState = z.infer<typeof SourceReviewStateSchema>
export type SourceRightsState = z.infer<typeof SourceRightsStateSchema>
export type QuotePermission = z.infer<typeof QuotePermissionSchema>
export type SourceAllowedUse = z.infer<typeof SourceAllowedUseSchema>
export type SourceType = z.infer<typeof SourceTypeSchema>

export type SourcePolicyDocument = {
  reviewState: string
  rightsStatus: string
  rightsGrants?: SourcePolicyRightsGrant[]
}

export type SourcePolicyChunk = {
  reviewState: string
  quotePermission: string
  safetyIntensity: string
}

export type SourcePolicyRightsGrant = {
  status: string
  allowedUses: unknown
  quoteAllowed: boolean
  expiresAt?: Date | string | null
  revokedAt?: Date | string | null
}

export type SourcePolicyOptions = {
  intendedUse?: SourceAllowedUse
  safetySeverity?: "none" | "low" | "medium" | "high"
  requireQuoteDisplay?: boolean
  now?: Date
}

export type SourcePolicyDecision = {
  eligible: boolean
  allowedUse: "paraphrase_generation" | "direct_quote_display" | "none"
  canDisplayQuote: boolean
  reasons: string[]
  grant?: SourcePolicyRightsGrant
}

export function evaluateSourceEligibility(
  document: SourcePolicyDocument,
  chunk: SourcePolicyChunk,
  options: SourcePolicyOptions = {},
): SourcePolicyDecision {
  const now = options.now ?? new Date()
  const reasons: string[] = []
  const intendedUse = options.intendedUse ?? "paraphrase_generation"

  if (!["approved", "approved_curriculum"].includes(document.reviewState)) {
    reasons.push("document_not_approved")
  }
  if (!["approved", "paraphrase_only"].includes(document.rightsStatus)) {
    reasons.push("document_rights_not_approved")
  }
  if (!["approved", "approved_curriculum"].includes(chunk.reviewState)) {
    reasons.push("chunk_not_approved")
  }
  if (chunk.safetyIntensity === "blocked") {
    reasons.push("chunk_blocked")
  }
  if (options.safetySeverity === "medium" && chunk.safetyIntensity === "sensitive") {
    reasons.push("chunk_sensitive_for_medium_safety")
  }
  if (options.safetySeverity === "high") {
    reasons.push("high_safety_bypasses_rag")
  }

  const grants = document.rightsGrants ?? []
  const paraphraseGrant = findUsableGrant(grants, "paraphrase_generation", now)
  if (!paraphraseGrant) {
    reasons.push("missing_paraphrase_rights")
  }

  const quoteGrant = findUsableGrant(grants, "direct_quote_display", now)
  const canDisplayQuote =
    chunk.quotePermission === "quote_safe" &&
    Boolean(quoteGrant?.quoteAllowed)

  if (options.requireQuoteDisplay && !canDisplayQuote) {
    reasons.push("missing_direct_quote_rights")
  }

  const eligible = reasons.length === 0
  return {
    eligible,
    allowedUse: eligible ? (canDisplayQuote && intendedUse === "direct_quote_display" ? "direct_quote_display" : "paraphrase_generation") : "none",
    canDisplayQuote: eligible && canDisplayQuote,
    reasons,
    grant: canDisplayQuote ? quoteGrant : paraphraseGrant,
  }
}

export function canDisplaySourceQuote(
  document: SourcePolicyDocument,
  chunk: SourcePolicyChunk,
  options: Omit<SourcePolicyOptions, "intendedUse" | "requireQuoteDisplay"> = {},
) {
  return evaluateSourceEligibility(document, chunk, {
    ...options,
    intendedUse: "direct_quote_display",
    requireQuoteDisplay: true,
  }).canDisplayQuote
}

export function parseAllowedUses(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string")
  }
  return []
}

function findUsableGrant(grants: SourcePolicyRightsGrant[], use: SourceAllowedUse, now: Date) {
  return grants.find((grant) => {
    if (use === "direct_quote_display") {
      if (grant.status !== "approved") return false
    } else if (!["approved", "paraphrase_only"].includes(grant.status)) {
      return false
    }
    if (grant.revokedAt) return false
    if (grant.expiresAt && new Date(grant.expiresAt) <= now) return false
    return parseAllowedUses(grant.allowedUses).includes(use)
  })
}
