import assert from "node:assert/strict"
import de from "../src/messages/de.json"
import el from "../src/messages/el.json"
import en from "../src/messages/en.json"
import es from "../src/messages/es.json"
import fr from "../src/messages/fr.json"
import zhHans from "../src/messages/zh-Hans.json"

const catalogs = { es, el, fr, de, "zh-Hans": zhHans } as const

function collectKeys(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [prefix]
  return Object.entries(value).flatMap(([key, child]) => collectKeys(child, prefix ? `${prefix}.${key}` : key))
}

const englishKeys = collectKeys(en).sort()

for (const [locale, catalog] of Object.entries(catalogs)) {
  assert.deepEqual(collectKeys(catalog).sort(), englishKeys, `${locale} web message catalog must match en key shape`)
}
