import { NextRequest, NextResponse } from "next/server"
import { isProtectedAppPath } from "@/lib/protected-routes"

export default function proxy(req: NextRequest) {
  const isProtected = isProtectedAppPath(req.nextUrl.pathname)

  if (!isProtected || req.cookies.has("ia_web_session")) {
    return NextResponse.next()
  }

  if (req.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const loginUrl = new URL("/login", req.url)
  loginUrl.searchParams.set("next", `${req.nextUrl.pathname}${req.nextUrl.search}`)
  return NextResponse.redirect(loginUrl)
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
