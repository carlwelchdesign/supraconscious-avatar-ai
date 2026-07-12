#!/usr/bin/env node
import fs from "node:fs"
import path from "node:path"

const root = process.cwd()
const failures = []

const localeFiles = {
  web: {
    dir: "apps/web/src/messages",
    files: ["en.json", "es.json", "el.json", "fr.json", "de.json", "zh-Hans.json"],
  },
  admin: {
    dir: "apps/admin/src/messages",
    files: ["en.json", "es.json", "el.json", "fr.json", "de.json", "zh-Hans.json"],
  },
  mobile: {
    dir: "apps/mobile/lib/l10n",
    files: ["app_en.arb", "app_es.arb", "app_el.arb", "app_fr.arb", "app_de.arb", "app_zh_Hans.arb"],
  },
}

for (const [name, group] of Object.entries(localeFiles)) {
  checkCatalogParity(name, group)
}

checkChatGptWidgetParity()
checkHardcodedStrings()

if (failures.length > 0) {
  console.error("Localization checks failed:")
  for (const failure of failures) console.error(`- ${failure}`)
  process.exit(1)
}

console.log("Localization checks passed.")

function checkCatalogParity(name, group) {
  const [baseFile, ...otherFiles] = group.files
  const baseKeys = catalogKeys(readJson(path.join(group.dir, baseFile)), name === "mobile")
  for (const file of otherFiles) {
    const keys = catalogKeys(readJson(path.join(group.dir, file)), name === "mobile")
    const missing = baseKeys.filter((key) => !keys.includes(key))
    const extra = keys.filter((key) => !baseKeys.includes(key))
    if (missing.length) failures.push(`${name} ${file} is missing keys: ${missing.slice(0, 20).join(", ")}`)
    if (extra.length) failures.push(`${name} ${file} has extra keys: ${extra.slice(0, 20).join(", ")}`)
  }
}

function catalogKeys(value, isArb, prefix = "") {
  if (!value || typeof value !== "object") return []
  return Object.entries(value)
    .filter(([key]) => !(isArb && key.startsWith("@")))
    .flatMap(([key, child]) => {
      const next = prefix ? `${prefix}.${key}` : key
      if (child && typeof child === "object" && !Array.isArray(child)) return catalogKeys(child, isArb, next)
      return [next]
    })
    .sort()
}

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"))
}

function checkChatGptWidgetParity() {
  const source = fs.readFileSync(path.join(root, "apps/chatgpt-app/src/widget/widget.js"), "utf8")
  const locales = ["en", "es", "el", "fr", "de", "zh-Hans"]
  const keySets = new Map()
  for (const locale of locales) {
    const localeStart = source.indexOf(locale === "zh-Hans" ? '"zh-Hans": {' : `${locale}: {`)
    if (localeStart < 0) {
      failures.push(`chatgpt widget is missing ${locale} copy`)
      continue
    }
    const nextLocaleStart = locales
      .slice(locales.indexOf(locale) + 1)
      .map((next) => source.indexOf(next === "zh-Hans" ? '"zh-Hans": {' : `${next}: {`, localeStart + 1))
      .find((index) => index > localeStart)
    const block = source.slice(localeStart, nextLocaleStart && nextLocaleStart > 0 ? nextLocaleStart : source.indexOf("};", localeStart))
    keySets.set(
      locale,
      [...block.matchAll(/^\s*([A-Za-z][A-Za-z0-9]+):/gm)]
        .map((item) => item[1])
        .filter((key) => !locales.includes(key))
        .sort(),
    )
  }
  const base = keySets.get("en") ?? []
  for (const locale of locales.slice(1)) {
    const keys = keySets.get(locale) ?? []
    const missing = base.filter((key) => !keys.includes(key))
    const extra = keys.filter((key) => !base.includes(key))
    if (missing.length) failures.push(`chatgpt widget ${locale} is missing keys: ${missing.join(", ")}`)
    if (extra.length) failures.push(`chatgpt widget ${locale} has extra keys: ${extra.join(", ")}`)
  }
}

function checkHardcodedStrings() {
  const targets = [
    {
      name: "mobile Flutter UI",
      files: ["apps/mobile/lib/src/app.dart", "apps/mobile/lib/src/mobile_api.dart"],
      allowed: [
        "System",
        "INNER_COUNCIL_API_BASE_URL",
        "Accept",
        "Accept-Language",
        "Content-Type",
        "Cookie",
        "PATCH",
        "DELETE",
        "Security key",
        "Approved source",
        "Current",
        "Complete",
      ],
    },
    {
      name: "web auth/passkey UI",
      files: [
        "apps/web/src/components/auth/auth-form.tsx",
        "apps/web/src/app/(auth)/mfa/passkey-mfa-form.tsx",
        "apps/web/src/app/(auth)/mfa/actions.ts",
        "apps/web/src/components/auth/passkey-settings.tsx",
      ],
      allowed: ["Content-Type", "Security key", "xxxx-xxxx-xxxx-xxxx", "one-time-code", "you@example.com"],
    },
    {
      name: "admin shell/login UI",
      files: [
        "apps/admin/src/app/layout.tsx",
        "apps/admin/src/components/admin-shell.tsx",
        "apps/admin/src/components/admin-login-form.tsx",
      ],
      allowed: ["Supraconscious Admin", "Internal administration for Supraconscious."],
    },
    {
      name: "chatgpt public UI",
      files: [
        "apps/chatgpt-app/src/server.ts",
        "apps/chatgpt-app/src/widget/index.html",
        "apps/chatgpt-app/src/widget/widget.js",
      ],
      allowed: [
        "Supraconscious",
        "Supraconscious Reflection",
        "Content-Type",
        "ChatGPT App MCP server running on port",
        "Health check",
        "MCP tools",
        "Pattern",
        "Materials",
      ],
    },
  ]

  const stringPattern = /(["'`])((?:(?!\\1)[^\\\\]|\\\\.){4,})\\1/g
  for (const target of targets) {
    for (const relativeFile of target.files) {
      const file = path.join(root, relativeFile)
      const source = fs.readFileSync(file, "utf8")
      for (const match of source.matchAll(stringPattern)) {
        const value = match[2]
        if (isLocalizationCatalogLiteral(relativeFile, source, match.index)) continue
        if (!looksUserFacingEnglish(value)) continue
        if (target.allowed.some((allowed) => value.includes(allowed))) continue
        if (isAuditSafeLiteral(value)) continue
        const line = source.slice(0, match.index).split("\\n").length
        failures.push(`${target.name}: hardcoded visible string in ${relativeFile}:${line}: ${value.slice(0, 100)}`)
      }
    }
  }
}

function isLocalizationCatalogLiteral(relativeFile, source, index) {
  if (relativeFile.endsWith("apps/chatgpt-app/src/widget/widget.js")) {
    const catalogStart = source.lastIndexOf("const WIDGET_COPY", index)
    if (catalogStart >= 0) return true
  }
  if (relativeFile.endsWith("apps/mobile/lib/src/mobile_api.dart")) {
    const preceding = source.slice(Math.max(0, index - 240), index)
    if (preceding.includes("_localizedMobileApiCopy(") || preceding.includes("en:")) return true
  }
  return false
}

function looksUserFacingEnglish(value) {
  if (!/[A-Za-z]/.test(value)) return false
  if (!/\\s/.test(value) && !/[.!?]/.test(value)) return false
  if (/^[a-z0-9_./:${}()[\\]\\-?=&]+$/i.test(value) && !/[.!?]/.test(value)) return false
  return /\\b(the|with|your|you|sign|continue|passkey|error|failed|save|write|reflect|admin|request|could|please|start|check|source|current|complete|added|remove|recovery|password|email|website)\\b/i.test(value)
}

function isAuditSafeLiteral(value) {
  return (
    value.startsWith("/") ||
    value.startsWith("http") ||
    value.includes("var(--") ||
    value.includes("rgba(") ||
    value.includes("grid ") ||
    value.includes("rounded-") ||
    value.includes("text-") ||
    value.includes("bg-") ||
    value.includes("border-") ||
    value.includes("hover:") ||
    value.includes("disabled:") ||
    value.includes("focus:") ||
    value.includes("md:") ||
    value.includes("mt-") ||
    value.includes("px-") ||
    value.includes("py-") ||
    value.includes("h-") ||
    value.includes("w-") ||
    /^[A-Z_]+$/.test(value) ||
    /^[a-z]+(-[a-z]+)+$/.test(value)
  )
}
