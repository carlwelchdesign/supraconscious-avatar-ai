import { DEFAULT_LANGUAGE, resolveSupportedLanguage, type SupportedLanguage } from "./language"

import de from "../messages/de.json"
import el from "../messages/el.json"
import en from "../messages/en.json"
import es from "../messages/es.json"
import fr from "../messages/fr.json"

const messages = { en, es, el, fr, de } as const

export function getWebMessages(language: unknown) {
  return messages[resolveSupportedLanguage(language)]
}

export function getWebLocale(language: unknown): SupportedLanguage {
  return resolveSupportedLanguage(language)
}

export function getDefaultWebMessages() {
  return messages[DEFAULT_LANGUAGE]
}
