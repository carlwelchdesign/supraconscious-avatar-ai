export const SUPPORTED_LANGUAGES = ["en", "es", "el", "fr", "de"] as const

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]

export const DEFAULT_LANGUAGE: SupportedLanguage = "en"

export const SUPPORTED_LANGUAGE_DETAILS: Record<SupportedLanguage, {
  code: SupportedLanguage
  label: string
  nativeLabel: string
  aiLanguageName: string
}> = {
  en: {
    code: "en",
    label: "English",
    nativeLabel: "English",
    aiLanguageName: "English",
  },
  es: {
    code: "es",
    label: "Spanish",
    nativeLabel: "Español",
    aiLanguageName: "Spanish",
  },
  el: {
    code: "el",
    label: "Greek",
    nativeLabel: "Ελληνικά",
    aiLanguageName: "Greek",
  },
  fr: {
    code: "fr",
    label: "French",
    nativeLabel: "Français",
    aiLanguageName: "French",
  },
  de: {
    code: "de",
    label: "German",
    nativeLabel: "Deutsch",
    aiLanguageName: "German",
  },
}

export function isSupportedLanguage(value: unknown): value is SupportedLanguage {
  return typeof value === "string" && SUPPORTED_LANGUAGES.includes(value as SupportedLanguage)
}

export function resolveSupportedLanguage(value: unknown): SupportedLanguage {
  if (isSupportedLanguage(value)) return value
  if (typeof value !== "string") return DEFAULT_LANGUAGE

  const normalized = value.trim().toLowerCase().replace("_", "-")
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
