import { NextRequest, NextResponse } from "next/server"
import { LANGUAGE_COOKIE_NAME, resolveSupportedLanguage } from "@/lib/language"

function safeRedirectTarget(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next")
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return new URL("/", request.url)
  }

  return new URL(next, request.url)
}

export function GET(request: NextRequest) {
  const language = resolveSupportedLanguage(request.nextUrl.searchParams.get("lang"))
  const response = NextResponse.redirect(safeRedirectTarget(request))

  response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })

  return response
}
