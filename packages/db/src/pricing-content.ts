export type PricingBillingPlan = "starter" | "pro"
export type PricingPlanKey = "free" | PricingBillingPlan

export type PricingDefaults = {
  back: string
  eyebrow: string
  titleA: string
  titleB: string
  body: string
  recommended: string
  cadenceAlways: string
  cadenceMonth: string
  billingDisabledNotice: string
  checkoutDisabled: string
  signInFor: string
  continueFree: string
  status: {
    invalidPlan: string
    cancelled: string
    unavailable: string
  }
  plans: Record<PricingPlanKey, {
    name: string
    price: string
    description: string
    features: string[]
    cta: string
  }>
}

export type PricingPlanContent = {
  key: PricingPlanKey
  displayOrder: number
  visible: boolean
  featured: boolean
  name: string
  price: string
  description: string
  features: string[]
  cta: string
  billingPlan: PricingBillingPlan | null
}

export type PricingPageContent = {
  back: string
  eyebrow: string
  titleA: string
  titleB: string
  body: string
  recommended: string
  cadenceAlways: string
  cadenceMonth: string
  billingDisabledNotice: string
  checkoutDisabled: string
  signInFor: string
  continueFree: string
  status: {
    invalidPlan: string
    cancelled: string
    unavailable: string
  }
  plans: PricingPlanContent[]
}

type PricingPageConfigRow = {
  active: boolean
  eyebrow: string | null
  titleA: string | null
  titleB: string | null
  body: string | null
  recommendedLabel: string | null
  cadenceAlways: string | null
  cadenceMonth: string | null
  billingDisabledNotice: string | null
  checkoutDisabled: string | null
  signInFor: string | null
  continueFree: string | null
  statusInvalidPlan: string | null
  statusCancelled: string | null
  statusUnavailable: string | null
}

type PricingPlanConfigRow = {
  planKey: string
  displayOrder: number
  visible: boolean
  featured: boolean
  name: string | null
  price: string | null
  description: string | null
  features: unknown
  cta: string | null
  billingPlan: string | null
}

type PricingContentReader = {
  pricingPageConfig: {
    findFirst(args: {
      where: { key: string; active: true }
      select: Record<keyof PricingPageConfigRow, true>
    }): Promise<PricingPageConfigRow | null>
  }
  pricingPlanConfig: {
    findMany(args: {
      orderBy: Array<{ displayOrder: "asc" } | { planKey: "asc" }>
      select: Record<keyof PricingPlanConfigRow, true>
    }): Promise<PricingPlanConfigRow[]>
  }
}

const DEFAULT_PLAN_ORDER: PricingPlanKey[] = ["free", "starter", "pro"]

export const ENGLISH_PRICING_DEFAULTS: PricingDefaults = {
  back: "Supraconscious",
  eyebrow: "Plans",
  titleA: "Choose your",
  titleB: "reflection rhythm.",
  body: "Start privately, then upgrade when you want a richer Inner Council practice with memory, voice, progression, and deeper pattern review. Paid plans use Stripe Checkout and can be managed from settings.",
  recommended: "Recommended",
  cadenceAlways: "always",
  cadenceMonth: "month",
  billingDisabledNotice: "Paid checkout is not enabled in this environment yet. The free reflection flow remains available.",
  checkoutDisabled: "Paid checkout is currently disabled.",
  signInFor: "Sign in for {plan}",
  continueFree: "Continue Free",
  status: {
    invalidPlan: "That plan was not recognized. Please choose one of the plans below.",
    cancelled: "Checkout was cancelled. Nothing was changed.",
    unavailable: "Paid checkout is not available in this environment yet. You can keep using the free reflection flow.",
  },
  plans: {
    free: {
      name: "Free",
      price: "$0",
      description: "A private place to start writing and receive grounded reflection.",
      features: [
        "Journal entries",
        "Safety-aware response handling",
        "Saved reflection history",
      ],
      cta: "Start Free",
    },
    starter: {
      name: "Starter",
      price: "$9",
      description: "The core Inner Council loop for regular guided reflection.",
      features: [
        "Council reflections",
        "Personalized prompts",
        "Pattern memory",
        "Voice transcription",
      ],
      cta: "Choose Starter",
    },
    pro: {
      name: "Pro",
      price: "$19",
      description: "More continuity for deeper pattern review and sustained practice.",
      features: [
        "Everything in Starter",
        "Expanded pattern dashboard",
        "Guide progression",
        "Priority AI usage",
      ],
      cta: "Choose Pro",
    },
  },
}

const DEFAULT_PLAN_META: Record<PricingPlanKey, {
  displayOrder: number
  featured: boolean
  billingPlan: PricingBillingPlan | null
}> = {
  free: { displayOrder: 0, featured: false, billingPlan: null },
  starter: { displayOrder: 1, featured: true, billingPlan: "starter" },
  pro: { displayOrder: 2, featured: false, billingPlan: "pro" },
}

export async function getPricingPageContent(
  client: PricingContentReader,
  defaults: PricingDefaults,
  options: { includeHiddenPlans?: boolean } = {},
): Promise<PricingPageContent> {
  const [pageRow, planRows] = await Promise.all([
    client.pricingPageConfig.findFirst({
      where: { key: "default", active: true },
      select: {
        active: true,
        eyebrow: true,
        titleA: true,
        titleB: true,
        body: true,
        recommendedLabel: true,
        cadenceAlways: true,
        cadenceMonth: true,
        billingDisabledNotice: true,
        checkoutDisabled: true,
        signInFor: true,
        continueFree: true,
        statusInvalidPlan: true,
        statusCancelled: true,
        statusUnavailable: true,
      },
    }),
    client.pricingPlanConfig.findMany({
      orderBy: [{ displayOrder: "asc" }, { planKey: "asc" }],
      select: {
        planKey: true,
        displayOrder: true,
        visible: true,
        featured: true,
        name: true,
        price: true,
        description: true,
        features: true,
        cta: true,
        billingPlan: true,
      },
    }),
  ])

  return mergePricingPageContent(pageRow, planRows, defaults, options)
}

export function mergePricingPageContent(
  pageRow: PricingPageConfigRow | null,
  planRows: PricingPlanConfigRow[],
  defaults: PricingDefaults,
  options: { includeHiddenPlans?: boolean } = {},
): PricingPageContent {
  const rowsByKey = new Map(
    planRows
      .filter((row): row is PricingPlanConfigRow & { planKey: PricingPlanKey } => isPricingPlanKey(row.planKey))
      .map((row) => [row.planKey, row]),
  )

  const plans = DEFAULT_PLAN_ORDER
    .map((planKey) => mergePricingPlan(planKey, rowsByKey.get(planKey), defaults))
    .filter((plan) => options.includeHiddenPlans || plan.visible)
    .sort((left, right) => left.displayOrder - right.displayOrder || DEFAULT_PLAN_ORDER.indexOf(left.key) - DEFAULT_PLAN_ORDER.indexOf(right.key))

  return {
    back: defaults.back,
    eyebrow: readText(pageRow?.eyebrow, defaults.eyebrow),
    titleA: readText(pageRow?.titleA, defaults.titleA),
    titleB: readText(pageRow?.titleB, defaults.titleB),
    body: readText(pageRow?.body, defaults.body),
    recommended: readText(pageRow?.recommendedLabel, defaults.recommended),
    cadenceAlways: readText(pageRow?.cadenceAlways, defaults.cadenceAlways),
    cadenceMonth: readText(pageRow?.cadenceMonth, defaults.cadenceMonth),
    billingDisabledNotice: readText(pageRow?.billingDisabledNotice, defaults.billingDisabledNotice),
    checkoutDisabled: readText(pageRow?.checkoutDisabled, defaults.checkoutDisabled),
    signInFor: readText(pageRow?.signInFor, defaults.signInFor),
    continueFree: readText(pageRow?.continueFree, defaults.continueFree),
    status: {
      invalidPlan: readText(pageRow?.statusInvalidPlan, defaults.status.invalidPlan),
      cancelled: readText(pageRow?.statusCancelled, defaults.status.cancelled),
      unavailable: readText(pageRow?.statusUnavailable, defaults.status.unavailable),
    },
    plans,
  }
}

export function normalizePricingFeatures(value: string) {
  return value
    .split(/\r?\n/)
    .map((feature) => feature.trim())
    .filter(Boolean)
}

export function isPricingBillingPlan(value: string | null | undefined): value is PricingBillingPlan {
  return value === "starter" || value === "pro"
}

export function isPricingPlanKey(value: string | null | undefined): value is PricingPlanKey {
  return value === "free" || isPricingBillingPlan(value)
}

function mergePricingPlan(
  planKey: PricingPlanKey,
  row: PricingPlanConfigRow | undefined,
  defaults: PricingDefaults,
): PricingPlanContent {
  const defaultPlan = defaults.plans[planKey]
  const meta = DEFAULT_PLAN_META[planKey]
  const rowBillingPlan = isPricingBillingPlan(row?.billingPlan) ? row.billingPlan : null
  const billingPlan = planKey === "free" ? null : rowBillingPlan ?? meta.billingPlan

  return {
    key: planKey,
    displayOrder: row?.displayOrder ?? meta.displayOrder,
    visible: row?.visible ?? true,
    featured: row?.featured ?? meta.featured,
    name: readText(row?.name, defaultPlan.name),
    price: readText(row?.price, defaultPlan.price),
    description: readText(row?.description, defaultPlan.description),
    features: readFeatureList(row?.features, defaultPlan.features),
    cta: readText(row?.cta, defaultPlan.cta),
    billingPlan,
  }
}

function readFeatureList(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback
  const features = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
  return features.length > 0 ? features : fallback
}

function readText(value: string | null | undefined, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback
}
