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

function collectStrings(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(collectStrings)
  if (!value || typeof value !== "object") return []
  return Object.values(value).flatMap(collectStrings)
}

for (const [locale, catalog] of Object.entries(catalogs)) {
  assert.deepEqual(collectKeys(catalog).sort(), englishKeys, `${locale} web message catalog must match en key shape`)
  assert.ok(catalog.journal.mirrorFormingStatus.trim(), `${locale} must localize the Mirror-forming status`)
  assert.ok(catalog.journal.mirrorFormingSupport.trim(), `${locale} must localize the Mirror-forming supporting line`)
  const publicTrustCopy = [
    ...collectStrings(catalog.landing.trustStatement),
    ...collectStrings(catalog.landing.trustSubtext),
    ...collectStrings(catalog.landing.thisIs),
  ].join(" ")
  assert.doesNotMatch(
    publicTrustCopy,
    /trusted by|genutzt von führungskräften|το εμπιστεύονται ηγέτες|usado por líderes|adopté par des leaders|受到.*领导者.*信任|testimonials?|μαρτυρίες|testimonios|témoignages|推荐语|identity reflection system|identitätsreflexion|αντανάκλασης ταυτότητας|reflexión de identidad|réflexion identitaire|身份反思系统|decision clarity engine|entscheidungsklarheit|καθαρότητας αποφάσεων|claridad para decisiones|clarté décisionnelle|决策清晰引擎/i,
    `${locale} must not ship unsupported social proof or identity/decision authority claims`,
  )
}

for (const [locale, catalog] of Object.entries({ en, ...catalogs })) {
  assert.doesNotMatch(
    catalog.settings.subscriptionDescription,
    /managed securely through stripe/i,
    `${locale} must not make an unqualified Stripe security claim`,
  )
  assert.doesNotMatch(
    catalog.settings.privacyDescription,
    /used only to|raw journal text stays protected/i,
    `${locale} privacy copy must describe processing and audited access without vague guarantees`,
  )
}

assert.equal(en.journal.mirrorFormingStatus, "Your reflection is taking shape…")
assert.equal(en.journal.mirrorFormingSupport, "Your words remain visible while the reflection takes shape.")
