import { NextRequest, NextResponse } from "next/server"
import {
  getStripe,
  markStripeSubscriptionDeleted,
  syncCheckoutSession,
  syncStripeSubscription,
} from "@inner-avatar/billing"
import { evaluateStripeWebhookReadiness } from "@/lib/billing-webhook-policy"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")
  const readiness = evaluateStripeWebhookReadiness({ signature })

  if (!readiness.ready) {
    return NextResponse.json({ error: readiness.error }, { status: readiness.status })
  }

  let event

  try {
    event = getStripe().webhooks.constructEvent(await req.text(), readiness.signature, readiness.webhookSecret)
  } catch {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed":
      await syncCheckoutSession(event.data.object)
      break
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncStripeSubscription(event.data.object)
      break
    case "customer.subscription.deleted":
      await markStripeSubscriptionDeleted(event.data.object)
      break
    default:
      break
  }

  return NextResponse.json({ received: true })
}
