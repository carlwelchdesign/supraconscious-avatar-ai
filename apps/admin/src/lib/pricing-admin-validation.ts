import { z } from "zod"
import {
  isPricingBillingPlan,
  isPricingPlanKey,
  normalizePricingFeatures,
  type PricingBillingPlan,
  type PricingPlanKey,
} from "@inner-avatar/db"

const PricingPageSchema = z.object({
  active: z.union([z.literal("on"), z.null()]).optional(),
  eyebrow: z.string().trim().optional(),
  titleA: z.string().trim().optional(),
  titleB: z.string().trim().optional(),
  body: z.string().trim().optional(),
  recommendedLabel: z.string().trim().optional(),
  cadenceAlways: z.string().trim().optional(),
  cadenceMonth: z.string().trim().optional(),
  billingDisabledNotice: z.string().trim().optional(),
  checkoutDisabled: z.string().trim().optional(),
  signInFor: z.string().trim().optional(),
  continueFree: z.string().trim().optional(),
  statusInvalidPlan: z.string().trim().optional(),
  statusCancelled: z.string().trim().optional(),
  statusUnavailable: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A pricing page change reason is required."),
})

const PricingPlanSchema = z.object({
  planKey: z.string().trim(),
  displayOrder: z.coerce.number().int().min(0).max(100),
  visible: z.union([z.literal("on"), z.null()]).optional(),
  featured: z.union([z.literal("on"), z.null()]).optional(),
  name: z.string().trim().optional(),
  price: z.string().trim().optional(),
  description: z.string().trim().optional(),
  features: z.string().optional(),
  cta: z.string().trim().optional(),
  billingPlan: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A pricing plan change reason is required."),
})

export function parsePricingPageForm(input: Record<string, unknown>) {
  const parsed = PricingPageSchema.safeParse(input)
  if (!parsed.success) return null

  return {
    active: parsed.data.active === "on",
    eyebrow: optionalText(parsed.data.eyebrow),
    titleA: optionalText(parsed.data.titleA),
    titleB: optionalText(parsed.data.titleB),
    body: optionalText(parsed.data.body),
    recommendedLabel: optionalText(parsed.data.recommendedLabel),
    cadenceAlways: optionalText(parsed.data.cadenceAlways),
    cadenceMonth: optionalText(parsed.data.cadenceMonth),
    billingDisabledNotice: optionalText(parsed.data.billingDisabledNotice),
    checkoutDisabled: optionalText(parsed.data.checkoutDisabled),
    signInFor: optionalText(parsed.data.signInFor),
    continueFree: optionalText(parsed.data.continueFree),
    statusInvalidPlan: optionalText(parsed.data.statusInvalidPlan),
    statusCancelled: optionalText(parsed.data.statusCancelled),
    statusUnavailable: optionalText(parsed.data.statusUnavailable),
    reason: parsed.data.reason,
  }
}

export function parsePricingPlanForm(input: Record<string, unknown>) {
  const parsed = PricingPlanSchema.safeParse(input)
  if (!parsed.success || !isPricingPlanKey(parsed.data.planKey)) return null

  const billingPlan = parseBillingPlan(parsed.data.planKey, parsed.data.billingPlan)
  if (billingPlan === undefined) return null

  return {
    planKey: parsed.data.planKey,
    displayOrder: parsed.data.displayOrder,
    visible: parsed.data.visible === "on",
    featured: parsed.data.featured === "on",
    name: optionalText(parsed.data.name),
    price: optionalText(parsed.data.price),
    description: optionalText(parsed.data.description),
    features: normalizePricingFeatures(parsed.data.features ?? ""),
    cta: optionalText(parsed.data.cta),
    billingPlan,
    reason: parsed.data.reason,
  }
}

function parseBillingPlan(planKey: PricingPlanKey, value: string | null | undefined): PricingBillingPlan | null | undefined {
  const trimmed = typeof value === "string" ? value.trim() : ""
  if (!trimmed) return planKey === "free" ? null : planKey
  if (!isPricingBillingPlan(trimmed)) return undefined
  return trimmed
}

function optionalText(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
