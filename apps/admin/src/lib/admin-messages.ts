import { DEFAULT_LANGUAGE, resolveSupportedLanguage, type SupportedLanguage } from "./language"
import de from "../messages/de.json"
import el from "../messages/el.json"
import en from "../messages/en.json"
import es from "../messages/es.json"
import fr from "../messages/fr.json"
import zhHans from "../messages/zh-Hans.json"

const messages = {
  de,
  el,
  en,
  es,
  fr,
  "zh-Hans": zhHans,
} satisfies Record<SupportedLanguage, typeof en>

export function getAdminMessages(language: unknown) {
  return messages[resolveSupportedLanguage(language)] ?? messages[DEFAULT_LANGUAGE]
}

export function getAdminIntlMessages(language: unknown) {
  return Object.fromEntries(
    Object.entries(getAdminMessages(language)).filter(([key]) => key !== "phrases"),
  )
}
