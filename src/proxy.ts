import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"
import { getAuthConfigurationMessage, isClerkConfigured, isLocalDemoAuthEnabled } from "@/lib/auth/config"

const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/journal(.*)",
  "/patterns(.*)",
  "/avatar(.*)",
  "/settings(.*)",
  "/api/journal(.*)",
  "/api/avatar(.*)",
  "/api/prompts(.*)",
  "/api/patterns(.*)",
])

const protectedProxy = clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect()
  }
})

function unconfiguredProxy(req: NextRequest) {
  if (isLocalDemoAuthEnabled() || !isProtectedRoute(req)) {
    return NextResponse.next()
  }

  if (new URL(req.url).pathname.startsWith("/api/")) {
    return NextResponse.json({ error: getAuthConfigurationMessage() }, { status: 503 })
  }

  return new NextResponse(getAuthConfigurationMessage(), {
    status: 503,
    headers: { "content-type": "text/plain; charset=utf-8" },
  })
}

export default isClerkConfigured() ? protectedProxy : unconfiguredProxy

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
