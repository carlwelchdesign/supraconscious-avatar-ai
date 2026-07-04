import { NextRequest, NextResponse } from "next/server"

export default function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  const isPublic = pathname === "/login" || pathname === "/api/health" || pathname.startsWith("/_next") || pathname === "/favicon.ico"

  if (isPublic || req.cookies.has("ia_admin_session")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Admin authorization required." }, { status: 401 })
  }

  return NextResponse.redirect(new URL("/login", req.url))
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
