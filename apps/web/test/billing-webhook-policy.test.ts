import { test } from "node:test"
import assert from "node:assert"
import { evaluateStripeWebhookReadiness } from "../src/lib/billing-webhook-policy"

test("billing webhook readiness rejects incomplete Stripe configuration before using Stripe", () => {
  const readiness = evaluateStripeWebhookReadiness({
    signature: "signed",
    env: {
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    },
  })

  assert.deepEqual(readiness, {
    ready: false,
    status: 400,
    error: "Stripe webhook is not configured.",
  })
})

test("billing webhook readiness distinguishes missing signature from disabled billing", () => {
  const readiness = evaluateStripeWebhookReadiness({
    signature: null,
    env: {
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    },
  })

  assert.deepEqual(readiness, {
    ready: false,
    status: 400,
    error: "Stripe webhook signature is missing.",
  })
})

test("billing webhook readiness returns the configured secret only when ready", () => {
  const readiness = evaluateStripeWebhookReadiness({
    signature: "signed",
    env: {
      STRIPE_SECRET_KEY: "sk_test",
      STRIPE_WEBHOOK_SECRET: "whsec_test",
    },
  })

  assert.deepEqual(readiness, {
    ready: true,
    signature: "signed",
    webhookSecret: "whsec_test",
  })
})
