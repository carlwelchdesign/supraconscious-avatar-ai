import {
  DEFAULT_LANGUAGE,
  LANGUAGE_COOKIE_NAME,
  resolveSupportedLanguage,
  type SupportedLanguage,
} from "@inner-avatar/types/language"

export { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, resolveSupportedLanguage, type SupportedLanguage }

export async function readAdminLanguage(): Promise<SupportedLanguage> {
  return DEFAULT_LANGUAGE
}
