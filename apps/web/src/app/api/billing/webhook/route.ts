import { NextRequest, NextResponse } from "next/server"
import {
  getStripe,
  markStripeSubscriptionDeleted,
  syncCheckoutSession,
  syncStripeSubscription,
} from "@inner-avatar/billing"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 400 })
  }

  let event

  try {
    event = getStripe().webhooks.constructEvent(await req.text(), signature, webhookSecret)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid Stripe webhook signature."
    return NextResponse.json({ error: message }, { status: 400 })
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
