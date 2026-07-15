import assert from "node:assert/strict"
import { normalizePricingFeatures } from "@inner-avatar/db"
import { parsePricingPageForm, parsePricingPlanForm } from "../src/lib/pricing-admin-validation"

assert.equal(parsePricingPageForm({
  active: "on",
  eyebrow: "Plans",
  titleA: "Choose",
  titleB: "carefully",
  body: "Body",
  recommendedLabel: "Recommended",
  cadenceAlways: "always",
  cadenceMonth: "month",
  billingDisabledNotice: "Disabled",
  checkoutDisabled: "No checkout",
  signInFor: "Sign in for {plan}",
  continueFree: "Continue Free",
  statusInvalidPlan: "Invalid",
  statusCancelled: "Cancelled",
  statusUnavailable: "Unavailable",
  reason: "too short",
}), null)

assert.equal(parsePricingPlanForm({
  planKey: "starter",
  displayOrder: 1,
  visible: "on",
  featured: "on",
  name: "Starter",
  price: "$9",
  description: "Description",
  features: "Feature one\n\n Feature two \r\n",
  cta: "Choose Starter",
  billingPlan: "enterprise",
  reason: "Testing invalid billing plan",
}), null)

const parsedPlan = parsePricingPlanForm({
  planKey: "starter",
  displayOrder: 1,
  visible: "on",
  featured: null,
  name: "Starter",
  price: "$9",
  description: "Description",
  features: "Feature one\n\n Feature two \r\n",
  cta: "Choose Starter",
  billingPlan: "",
  reason: "Testing starter plan save",
})

assert.deepEqual(parsedPlan, {
  planKey: "starter",
  displayOrder: 1,
  visible: true,
  featured: false,
  name: "Starter",
  price: "$9",
  description: "Description",
  features: ["Feature one", "Feature two"],
  cta: "Choose Starter",
  billingPlan: "starter",
  reason: "Testing starter plan save",
})

assert.deepEqual(normalizePricingFeatures(" A \n\nB\n "), ["A", "B"])
