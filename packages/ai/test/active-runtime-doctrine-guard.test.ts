import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, extname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import * as ts from "typescript"
import {
  FOUNDER_ATTRIBUTION_PATTERNS,
  REMOVED_PUBLIC_TERMS,
} from "../src/prohibited-language-policy.js"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

const PUBLIC_SURFACE_PATHS = [
  "apps/web/src",
  "apps/admin/src",
  "apps/chatgpt-app/src",
  "apps/mobile/lib",
  "packages/auth/src",
  "packages/db/src",
  "packages/db/prisma",
  "packages/ui/src",
  "packages/ai/scripts/seed-internal-pilot.ts",
  "packages/ai/src/active-reflection-runtime.ts",
  "packages/ai/src/analyze-entry.ts",
  "packages/ai/src/avatar-system-prompt.ts",
  "packages/ai/src/generate-avatar-response.ts",
  "packages/ai/src/generate-symbolic-prompt.ts",
  "packages/ai/src/guide-voice-contract.ts",
  "packages/ai/src/response-language.ts",
  "packages/ai/src/source-provenance.ts",
] as const

const DOCUMENTED_COMPATIBILITY_ALLOWLIST = [
  {
    path: "apps/web/src/app/page.tsx",
    rule: "removed_public_term:Echo",
    valuePattern: /landing\/echo-eye-cosmos\.png/i,
    reason: "Legacy asset filename; no persona-stage name is rendered.",
  },
  {
    path: "apps/web/src/lib/voice/voice-config.ts",
    rule: "removed_public_term:Echo",
    valuePattern: /^echo$/i,
    reason: "OpenAI vendor voice identifier, not product terminology.",
  },
  {
    path: "apps/mobile/lib/src/app.dart",
    rule: "removed_public_term:Echo",
    valuePattern: /assets\/images\/echo-eye-cosmos\.png/i,
    reason: "Legacy asset filename; no persona-stage name is rendered.",
  },
  {
    path: "apps/admin/src/app/(admin)/council/page.tsx",
    rule: "removed_public_term:Inner Council",
    valuePattern: /Metadata-first review of Inner Council runs/i,
    reason: "Admin-only review of historical council records.",
  },
  {
    path: "apps/admin/src/app/(admin)/prompts/page.tsx",
    rule: "removed_public_term:Inner Council",
    valuePattern: /Versioned Inner Council system prompt/i,
    reason: "Admin-only maintenance of disabled legacy prompt records.",
  },
  {
    path: "apps/admin/src/app/(admin)/pilot/page.tsx",
    rule: "removed_public_term:Inner Council",
    valuePattern: /Inner Council MCP tool available/i,
    reason: "Admin-only compatibility status for the disabled legacy MCP tool.",
  },
  {
    path: "apps/admin/src/app/(admin)/sources/readiness/page.tsx",
    rule: "removed_public_term:Threshold",
    valuePattern: /blocker rate exceeds threshold/i,
    reason: "Generic engineering threshold, not the removed session entry term.",
  },
  {
    path: "packages/db/prisma/schema.prisma",
    rule: "removed_public_term:Echo",
    valuePattern: /avatarStage.*Echo to Inner Author/i,
    reason: "Historical schema compatibility comment for legacy records.",
  },
  {
    path: "packages/db/prisma/schema.prisma",
    rule: "removed_public_term:Inner Author",
    valuePattern: /avatarStage.*Echo to Inner Author/i,
    reason: "Historical schema compatibility comment for legacy records.",
  },
  {
    path: "packages/db/prisma/schema.prisma",
    rule: "removed_public_term:Inner Council",
    valuePattern: /Council session - one structured Inner Council reflection run/i,
    reason: "Historical schema compatibility comment for legacy records.",
  },
] as const

const TEXT_EXTENSIONS = new Set([".arb", ".dart", ".js", ".json", ".prisma", ".ts", ".tsx"])

test("public surfaces reject prohibited doctrine and attribution language", () => {
  const violations: string[] = []
  const usedAllowlistEntries = new Set<number>()

  for (const relativeRoot of PUBLIC_SURFACE_PATHS) {
    for (const filePath of listTextFiles(resolve(REPO_ROOT, relativeRoot))) {
      const relativePath = filePath.slice(REPO_ROOT.length + 1)
      for (const value of readUserVisibleValues(filePath)) {
        for (const term of REMOVED_PUBLIC_TERMS) {
          const rule = `removed_public_term:${term}`
          if (!new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(value)) continue
          if (!isAllowlisted(relativePath, rule, value, usedAllowlistEntries)) {
            violations.push(`${relativePath}: ${rule}`)
          }
        }
        for (const { key, pattern } of FOUNDER_ATTRIBUTION_PATTERNS) {
          const rule = `founder_attribution:${key}`
          if (!pattern.test(value)) continue
          if (!isAllowlisted(relativePath, rule, value, usedAllowlistEntries)) {
            violations.push(`${relativePath}: ${rule}`)
          }
        }
      }
    }
  }

  assert.deepEqual(violations, [])
  assert.deepEqual(
    [...usedAllowlistEntries].sort((a, b) => a - b),
    DOCUMENTED_COMPATIBILITY_ALLOWLIST.map((_, index) => index),
    "Every compatibility exception must remain present, narrow, and documented.",
  )
})

test("every localized session entry label preserves Mirror as the product term", () => {
  const localizationFiles = [
    ...listTextFiles(resolve(REPO_ROOT, "apps/web/src/messages")),
    ...listTextFiles(resolve(REPO_ROOT, "apps/mobile/lib/l10n")),
  ].filter((filePath) => [".arb", ".json"].includes(extname(filePath)))

  for (const filePath of localizationFiles) {
    const localization = JSON.parse(readFileSync(filePath, "utf8"))
    const values = collectJsonValuesForKey(localization, "thresholdLabel")
    assert.ok(values.length > 0, `${filePath} must define thresholdLabel`)
    for (const value of values) {
      assert.match(value, /^Mirror\b/, `${filePath} must render Mirror instead of a translated legacy entry term`)
    }

    if (filePath.includes("apps/web/src/messages")) {
      const onboardingTitle = readNestedString(localization, ["onboarding", "title"])
      assert.match(onboardingTitle, /\bMirror\b/, `${filePath} onboarding title must use Mirror`)
    }
  }
})

function isAllowlisted(relativePath: string, rule: string, value: string, used: Set<number>) {
  const index = DOCUMENTED_COMPATIBILITY_ALLOWLIST.findIndex(
    (entry) => entry.path === relativePath && entry.rule === rule && entry.valuePattern.test(value),
  )
  if (index === -1) return false
  used.add(index)
  return true
}

function readUserVisibleValues(filePath: string): string[] {
  const content = readFileSync(filePath, "utf8")
  const extension = extname(filePath)

  if (extension === ".json" || extension === ".arb") {
    return collectJsonStrings(JSON.parse(content))
  }
  if (extension === ".ts" || extension === ".tsx" || extension === ".js") {
    return collectJavaScriptStrings(filePath, content)
  }
  if (extension === ".dart") {
    return content
      .split("\n")
      .flatMap((line) => [...line.matchAll(/(['"])(?:\\.|(?!\1).)*\1/g)].map((match) => match[0].slice(1, -1)))
  }

  return [content]
}

function collectJsonStrings(value: unknown): string[] {
  if (typeof value === "string") return [value]
  if (Array.isArray(value)) return value.flatMap(collectJsonStrings)
  if (value && typeof value === "object") return Object.values(value).flatMap(collectJsonStrings)
  return []
}

function collectJsonValuesForKey(value: unknown, targetKey: string): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => collectJsonValuesForKey(item, targetKey))
  if (!value || typeof value !== "object") return []

  return Object.entries(value).flatMap(([key, child]) => [
    ...(key === targetKey && typeof child === "string" ? [child] : []),
    ...collectJsonValuesForKey(child, targetKey),
  ])
}

function readNestedString(value: unknown, path: string[]): string {
  let current = value
  for (const key of path) {
    if (!current || typeof current !== "object" || !(key in current)) return ""
    current = (current as Record<string, unknown>)[key]
  }
  return typeof current === "string" ? current : ""
}

function collectJavaScriptStrings(filePath: string, content: string): string[] {
  const values: string[] = []
  const source = ts.createSourceFile(
    filePath,
    content,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : filePath.endsWith(".js") ? ts.ScriptKind.JS : ts.ScriptKind.TS,
  )
  const visit = (node: ts.Node) => {
    if (ts.isStringLiteralLike(node) || ts.isJsxText(node)) values.push(node.text)
    ts.forEachChild(node, visit)
  }
  visit(source)
  return values
}

function listTextFiles(path: string): string[] {
  if (!statSync(path).isDirectory()) return [path]

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const child = resolve(path, entry.name)
    if (entry.isDirectory()) return listTextFiles(child)
    return TEXT_EXTENSIONS.has(extname(entry.name)) ? [child] : []
  })
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}
