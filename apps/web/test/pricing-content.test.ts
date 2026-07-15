import assert from "node:assert/strict"
import {
  ENGLISH_PRICING_DEFAULTS,
  mergePricingPageContent,
} from "@inner-avatar/db"

const defaults = ENGLISH_PRICING_DEFAULTS

const customized = mergePricingPageContent(
  {
    active: true,
    eyebrow: "Membership",
    titleA: null,
    titleB: "custom rhythm.",
    body: "Custom body",
    recommendedLabel: "Best fit",
    cadenceAlways: null,
    cadenceMonth: "monthly",
    billingDisabledNotice: null,
    checkoutDisabled: null,
    signInFor: null,
    continueFree: null,
    statusInvalidPlan: "Pick a valid plan.",
    statusCancelled: null,
    statusUnavailable: null,
  },
  [
    {
      planKey: "starter",
      displayOrder: 3,
      visible: true,
      featured: false,
      name: "Starter Custom",
      price: "$11",
      description: null,
      features: ["Feature A", "Feature B"],
      cta: "Start Starter",
      billingPlan: "starter",
    },
    {
      planKey: "pro",
      displayOrder: 2,
      visible: false,
      featured: false,
      name: "Hidden Pro",
      price: "$22",
      description: "Hidden description",
      features: ["Hidden feature"],
      cta: "Hidden CTA",
      billingPlan: "pro",
    },
  ],
  defaults,
)

assert.equal(customized.eyebrow, "Membership")
assert.equal(customized.titleA, defaults.titleA)
assert.equal(customized.titleB, "custom rhythm.")
assert.equal(customized.recommended, "Best fit")
assert.equal(customized.cadenceMonth, "monthly")
assert.equal(customized.status.invalidPlan, "Pick a valid plan.")
assert.deepEqual(customized.plans.map((plan) => plan.key), ["free", "starter"])

const starter = customized.plans.find((plan) => plan.key === "starter")
assert.equal(starter?.name, "Starter Custom")
assert.equal(starter?.price, "$11")
assert.equal(starter?.description, defaults.plans.starter.description)
assert.deepEqual(starter?.features, ["Feature A", "Feature B"])
assert.equal(starter?.cta, "Start Starter")
assert.equal(starter?.billingPlan, "starter")

const includeHidden = mergePricingPageContent(null, [
  {
    planKey: "pro",
    displayOrder: 2,
    visible: false,
    featured: false,
    name: "Hidden Pro",
    price: "$22",
    description: "Hidden description",
    features: ["Hidden feature"],
    cta: "Hidden CTA",
    billingPlan: "not-a-plan",
  },
], defaults, { includeHiddenPlans: true })

assert.deepEqual(includeHidden.plans.map((plan) => plan.key), ["free", "starter", "pro"])
assert.equal(includeHidden.plans.find((plan) => plan.key === "pro")?.visible, false)
assert.equal(includeHidden.plans.find((plan) => plan.key === "pro")?.billingPlan, "pro")
