import { cookies, headers } from "next/headers"
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  readSupportedLanguageFromHeader,
  resolveSupportedLanguage,
  type SupportedLanguage,
} from "@inner-avatar/types/language"

export { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, resolveSupportedLanguage, type SupportedLanguage }

export async function readAdminLanguage(): Promise<SupportedLanguage> {
  const cookieStore = await cookies()
  const savedLanguage = cookieStore.get(LANGUAGE_COOKIE_NAME)?.value
  if (savedLanguage) return resolveSupportedLanguage(savedLanguage)

  const headerStore = await headers()
  return readSupportedLanguageFromHeader(headerStore.get("accept-language"))
}

