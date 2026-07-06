import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createBillingPortalSession } from "@inner-avatar/billing"
import { requireAppUser } from "@inner-avatar/auth/session"
import { resolveFirstPartyAppOrigin } from "@/lib/app-origin"

export async function POST() {
  const user = await requireAppUser()
  const origin = await requestOrigin()
  let session
  try {
    session = await createBillingPortalSession({
      userId: user.id,
      origin,
    })
  } catch {
    return NextResponse.redirect(`${origin}/settings?billing=unavailable`, 303)
  }

  if (!session.url) {
    return NextResponse.redirect(`${origin}/settings?billing=unavailable`, 303)
  }

  return NextResponse.redirect(session.url, 303)
}

async function requestOrigin() {
  const headerStore = await headers()
  return resolveFirstPartyAppOrigin({
    requestOrigin: headerStore.get("origin"),
    requestHost: headerStore.get("host"),
  })
}
