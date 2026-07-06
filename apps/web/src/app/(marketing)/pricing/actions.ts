"use server"

import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { createSubscriptionCheckoutSession, type BillingPlan } from "@inner-avatar/billing"
import { requireAppUser } from "@inner-avatar/auth/session"
import { resolveFirstPartyAppOrigin } from "@/lib/app-origin"

const validPlans = new Set<BillingPlan>(["starter", "pro"])

export async function startCheckoutAction(formData: FormData) {
  const plan = formData.get("plan")
  if (typeof plan !== "string" || !validPlans.has(plan as BillingPlan)) {
    redirect("/pricing?checkout=invalid-plan")
  }

  const user = await requireAppUser()
  const origin = await requestOrigin()
  let session
  try {
    session = await createSubscriptionCheckoutSession({
      userId: user.id,
      email: user.email,
      plan: plan as BillingPlan,
      origin,
    })
  } catch {
    redirect("/pricing?checkout=unavailable")
  }

  if (!session.url) {
    redirect("/pricing?checkout=unavailable")
  }

  redirect(session.url)
}

async function requestOrigin() {
  const headerStore = await headers()
  return resolveFirstPartyAppOrigin({
    requestOrigin: headerStore.get("origin"),
    requestHost: headerStore.get("host"),
  })
}
