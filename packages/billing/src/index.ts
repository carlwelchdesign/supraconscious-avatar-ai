import "server-only"

import Stripe from "stripe"
import { prisma } from "@inner-avatar/db"

export type BillingPlan = "starter" | "pro"

const PLAN_PRICE_ENV: Record<BillingPlan, string> = {
  starter: "STRIPE_STARTER_PRICE_ID",
  pro: "STRIPE_PRO_PRICE_ID",
}

let stripeClient: Stripe | null = null

export function getStripe() {
  if (!stripeClient) {
    const apiKey = process.env.STRIPE_SECRET_KEY
    if (!apiKey) throw new Error("STRIPE_SECRET_KEY is not set")
    stripeClient = new Stripe(apiKey)
  }

  return stripeClient
}

export function isStripeConfigured() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_STARTER_PRICE_ID &&
      process.env.STRIPE_PRO_PRICE_ID,
  )
}

export function priceIdForPlan(plan: BillingPlan) {
  const priceId = process.env[PLAN_PRICE_ENV[plan]]
  if (!priceId) throw new Error(`${PLAN_PRICE_ENV[plan]} is not set`)
  return priceId
}

export function planForPriceId(priceId: string | null | undefined) {
  if (!priceId) return "free"
  if (priceId === process.env.STRIPE_STARTER_PRICE_ID) return "starter"
  if (priceId === process.env.STRIPE_PRO_PRICE_ID) return "pro"
  return "unknown"
}

export async function createSubscriptionCheckoutSession({
  userId,
  email,
  plan,
  origin,
}: {
  userId: string
  email: string
  plan: BillingPlan
  origin: string
}) {
  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  })

  return getStripe().checkout.sessions.create({
    mode: "subscription",
    customer: existingSubscription?.stripeCustomerId ?? undefined,
    customer_email: existingSubscription?.stripeCustomerId ? undefined : email,
    client_reference_id: userId,
    line_items: [{ price: priceIdForPlan(plan), quantity: 1 }],
    metadata: { userId, plan },
    subscription_data: { metadata: { userId, plan } },
    success_url: `${origin}/settings?checkout=success`,
    cancel_url: `${origin}/pricing?checkout=cancelled`,
  })
}

export async function createBillingPortalSession({
  userId,
  origin,
}: {
  userId: string
  origin: string
}) {
  const subscription = await prisma.subscription.findFirst({
    where: { userId, stripeCustomerId: { not: null } },
    orderBy: { updatedAt: "desc" },
  })

  if (!subscription?.stripeCustomerId) throw new Error("No Stripe customer exists for this user")

  return getStripe().billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${origin}/settings`,
  })
}

export async function syncCheckoutSession(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.userId
  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription?.id

  if (!userId || !subscriptionId) return

  const subscription = await getStripe().subscriptions.retrieve(subscriptionId)
  await syncStripeSubscription(subscription, userId)
}

export async function syncStripeSubscription(subscription: Stripe.Subscription, fallbackUserId?: string) {
  const userId = subscription.metadata.userId || fallbackUserId
  if (!userId) return

  const firstItem = subscription.items.data[0]
  const priceId = firstItem?.price.id ?? null
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: customerId },
        { userId },
      ],
    },
    orderBy: { updatedAt: "desc" },
  })

  const data = {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    plan: planForPriceId(priceId),
    status: normalizeStripeStatus(subscription.status),
    currentPeriodStart: secondsToDate(firstItem?.current_period_start),
    currentPeriodEnd: secondsToDate(firstItem?.current_period_end),
  }

  if (existingSubscription) {
    await prisma.subscription.update({
      where: { id: existingSubscription.id },
      data,
    })
    return
  }

  await prisma.subscription.create({
    data: {
      ...data,
      userId,
    },
  })
}

export async function markStripeSubscriptionDeleted(subscription: Stripe.Subscription) {
  await prisma.subscription.updateMany({
    where: { stripeSubscriptionId: subscription.id },
    data: {
      status: "canceled",
      currentPeriodEnd: new Date(),
    },
  })
}

export async function archiveStripeCustomerForAccountDeletion({
  stripeCustomerId,
  stripeSubscriptionIds,
}: {
  stripeCustomerId: string | null | undefined
  stripeSubscriptionIds: Array<string | null | undefined>
}) {
  if (!stripeCustomerId || !process.env.STRIPE_SECRET_KEY) {
    return {
      stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
      customerDeleted: false,
      canceledSubscriptions: 0,
    }
  }

  const stripe = getStripe()
  let canceledSubscriptions = 0
  const uniqueSubscriptionIds = [...new Set(stripeSubscriptionIds.filter((id): id is string => Boolean(id)))]

  for (const subscriptionId of uniqueSubscriptionIds) {
    try {
      await stripe.subscriptions.cancel(subscriptionId)
      canceledSubscriptions += 1
    } catch (error) {
      if (!isStripeMissingResourceError(error)) throw error
    }
  }

  try {
    await stripe.customers.del(stripeCustomerId)
    return {
      stripeConfigured: true,
      customerDeleted: true,
      canceledSubscriptions,
    }
  } catch (error) {
    if (!isStripeMissingResourceError(error)) throw error
    return {
      stripeConfigured: true,
      customerDeleted: false,
      canceledSubscriptions,
    }
  }
}

function secondsToDate(value: number | null | undefined) {
  return typeof value === "number" ? new Date(value * 1000) : null
}

function normalizeStripeStatus(status: Stripe.Subscription.Status) {
  if (status === "active" || status === "trialing") return "active"
  if (status === "past_due" || status === "unpaid") return "past_due"
  if (status === "canceled") return "canceled"
  return "inactive"
}

function isStripeMissingResourceError(error: unknown) {
  return error instanceof Stripe.errors.StripeInvalidRequestError && error.code === "resource_missing"
}
