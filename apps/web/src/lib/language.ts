import { headers } from "next/headers"
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGE_DETAILS,
  SUPPORTED_LANGUAGES,
  readSupportedLanguageFromHeader,
  resolveSupportedLanguage,
  type SupportedLanguage,
} from "@inner-avatar/types/language"

export {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGE_DETAILS,
  SUPPORTED_LANGUAGES,
  readSupportedLanguageFromHeader,
  resolveSupportedLanguage,
  type SupportedLanguage,
}

export async function readRequestLanguage(): Promise<SupportedLanguage> {
  const headerStore = await headers()
  return readSupportedLanguageFromHeader(headerStore.get("accept-language"))
}

export function supportedLanguageOptions() {
  return SUPPORTED_LANGUAGES.map((code) => SUPPORTED_LANGUAGE_DETAILS[code])
}
