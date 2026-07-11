import { cookies, headers } from "next/headers"
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  SUPPORTED_LANGUAGE_DETAILS,
  SUPPORTED_LANGUAGES,
  readSupportedLanguageFromHeader,
  resolveSupportedLanguage,
  type SupportedLanguage,
} from "@inner-avatar/types/language"

export {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  SUPPORTED_LANGUAGE_DETAILS,
  SUPPORTED_LANGUAGES,
  readSupportedLanguageFromHeader,
  resolveSupportedLanguage,
  type SupportedLanguage,
}

export async function readRequestLanguage(): Promise<SupportedLanguage> {
  const cookieStore = await cookies()
  const savedLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value
  if (savedLanguage) return resolveSupportedLanguage(savedLanguage)

  const headerStore = await headers()
  return readSupportedLanguageFromHeader(headerStore.get("accept-language"))
}

export async function writeLanguageCookie(language: unknown) {
  const cookieStore = await cookies()
  cookieStore.set(LANGUAGE_COOKIE_NAME, resolveSupportedLanguage(language), {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  })
}

export function supportedLanguageOptions() {
  return SUPPORTED_LANGUAGES.map((code) => SUPPORTED_LANGUAGE_DETAILS[code])
}
