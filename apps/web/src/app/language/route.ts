import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { LANGUAGE_COOKIE_NAME, resolveSupportedLanguage, type SupportedLanguage } from "@/lib/language"

function safeRedirectTarget(request: NextRequest) {
  const next = request.nextUrl.searchParams.get("next")
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return new URL("/", request.url)
  }

  return new URL(next, request.url)
}

export async function GET(request: NextRequest) {
  const language = resolveSupportedLanguage(request.nextUrl.searchParams.get("lang"))
  const response = NextResponse.redirect(safeRedirectTarget(request))
  await persistLanguagePreference(language)
  setLanguageCookie(response, language)

  return response
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    body = null
  }

  const requestedLanguage =
    body && typeof body === "object" && "lang" in body ? (body as { lang?: unknown }).lang : request.nextUrl.searchParams.get("lang")
  const language = resolveSupportedLanguage(
    requestedLanguage,
  )
  const response = NextResponse.json({ ok: true, language })
  await persistLanguagePreference(language)
  setLanguageCookie(response, language)

  return response
}

async function persistLanguagePreference(language: SupportedLanguage) {
  try {
    const user = await getCurrentUser()

    if (user && user.preferredLanguage !== language) {
      await prisma.user.update({
        where: { id: user.id },
        data: { preferredLanguage: language },
      })
    }
  } catch (error) {
    console.error("Unable to persist language preference", error)
  }
}

function setLanguageCookie(response: NextResponse, language: SupportedLanguage) {
  response.cookies.set(LANGUAGE_COOKIE_NAME, language, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}
