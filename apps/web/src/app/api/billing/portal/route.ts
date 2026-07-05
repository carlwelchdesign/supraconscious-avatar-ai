import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { createBillingPortalSession } from "@inner-avatar/billing"
import { requireAppUser } from "@inner-avatar/auth/session"

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
  const origin = headerStore.get("origin")
  if (origin) return origin

  const host = headerStore.get("host")
  const protocol = process.env.NODE_ENV === "production" ? "https" : "http"
  return host ? `${protocol}://${host}` : process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
}
