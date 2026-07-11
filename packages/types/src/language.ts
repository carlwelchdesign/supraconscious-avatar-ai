export const SUPPORTED_LANGUAGES = ["en", "es", "el", "fr", "de", "zh-Hans"] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = "en"
export const LANGUAGE_COOKIE_NAME = "inner_avatar_language"

export const SUPPORTED_LANGUAGE_DETAILS: Record<SupportedLanguage, {
  code: SupportedLanguage
  label: string
  nativeLabel: string
  aiLanguageName: string
  flag: string
}> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    aiLanguageName: "English",
    flag: "🇺🇸",
  },
  es: {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    aiLanguageName: "Spanish",
    flag: "🇪🇸",
  },
  el: {
    code: "el",
    label: "Greek",
    nativeLabel: "Ελληνικά",
    aiLanguageName: "Greek",
    flag: "🇬🇷",
  },
  fr: {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    aiLanguageName: "French",
    flag: "🇫🇷",
  },
  de: {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    aiLanguageName: "German",
    flag: "🇩🇪",
  },
  "zh-Hans": {
    code: "zh-Hans",
    label: "Chinese (Simplified)",
    nativeLabel: "简体中文",
    aiLanguageName: "Simplified Chinese",
    flag: "🇨🇳",
  },
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
}

export function resolveSupportedLanguage(value: unknown): SupportedLanguage {
  if (isSupportedLanguage(value)) return value
  if (typeof value !== "string") return DEFAULT_LANGUAGE

  const normalized = value.trim().toLowerCase().replace("_", "-")
  if (normalized === "zh" || normalized === "zh-hans" || normalized === "zh-cn" || normalized === "zh-sg") {
    return "zh-Hans"
  }

  const primary = normalized.split("-")[0]
  return isSupportedLanguage(primary) ? primary : DEFAULT_LANGUAGE
}

export function readSupportedLanguageFromHeader(value: string | null | undefined): SupportedLanguage {
  if (!value) return DEFAULT_LANGUAGE
  const candidates = value
    .split(",")
    .map((item) => item.trim().split(";")[0])
    .filter(Boolean)

  for (const candidate of candidates) {
    const language = resolveSupportedLanguage(candidate)
    if (language !== DEFAULT_LANGUAGE || candidate.toLowerCase().startsWith(DEFAULT_LANGUAGE)) {
      return language
    }
  }

  return DEFAULT_LANGUAGE
}
