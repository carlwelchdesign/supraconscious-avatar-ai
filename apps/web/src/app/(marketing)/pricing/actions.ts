"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createSubscriptionCheckoutSession, type BillingPlan } from "@inner-avatar/billing"
import { requireAppUser } from "@inner-avatar/auth/session"

const validPlans = new Set<BillingPlan>(["starter", "pro"])

export async function startCheckoutAction(formData: FormData) {
  const plan = formData.get("plan")
  if (typeof plan !== "string" || !validPlans.has(plan as BillingPlan)) {
    redirect("/pricing?checkout=invalid-plan")
  }

  const user = await requireAppUser()
  const origin = await requestOrigin()
  const session = await createSubscriptionCheckoutSession({
    userId: user.id,
    email: user.email,
    plan: plan as BillingPlan,
    origin,
  })

  if (!session.url) {
    redirect("/pricing?checkout=unavailable")
  }

  redirect(session.url)
}

async function requestOrigin() {
  const headerStore = await headers()
  const origin = headerStore.get("origin")
  if (origin) return origin

  const host = headerStore.get("host")
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  return host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
