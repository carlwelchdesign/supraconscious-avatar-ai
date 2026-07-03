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
