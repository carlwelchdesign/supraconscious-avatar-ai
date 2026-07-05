type StripeWebhookEnv = Record<string, string | undefined>

export type StripeWebhookReadiness =
  | {
      ready: true
      signature: string
      webhookSecret: string
    }
  | {
      ready: false
      status: 400
      error: string
    }

export function evaluateStripeWebhookReadiness({
  signature,
  env = process.env,
}: {
  signature: string | null
  env?: StripeWebhookEnv
}): StripeWebhookReadiness {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return {
      ready: false,
      status: 400,
      error: "Stripe webhook is not configured.",
    }
  }

  if (!signature) {
    return {
      ready: false,
      status: 400,
      error: "Stripe webhook signature is missing.",
    }
  }

  return {
    ready: true,
    signature,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  }
}
