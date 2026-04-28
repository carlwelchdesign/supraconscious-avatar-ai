import { NextRequest, NextResponse } from "next/server"

const protectedRoutePrefixes = [
  "/dashboard(.*)",
  "/journal(.*)",
  "/patterns(.*)",
  "/avatar(.*)",
  "/settings(.*)",
  "/admin(.*)",
  "/api/journal(.*)",
  "/api/avatar(.*)",
  "/api/prompts(.*)",
  "/api/patterns(.*)",
]

export default function proxy(req: NextRequest) {
  const isProtected = protectedRoutePrefixes.some((pattern) => {
    const prefix = pattern.replace("(.*)", "")
    return req.nextUrl.pathname === prefix || req.nextUrl.pathname.startsWith(`${prefix}/`)
  })

  if (!isProtected || req.cookies.has("inner_avatar_session")) {
    return NextResponse.next()
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/login", req.url))
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
