import assert from "node:assert/strict"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { dirname, extname, resolve } from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"
import { REMOVED_PUBLIC_TERMS } from "../src/doctrine-contract.js"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")
const ACTIVE_SURFACE_PATHS = [
  "apps/web/src/messages",
  "apps/web/src/app/layout.tsx",
  "apps/web/src/app/(app)/guide-page-content.tsx",
  "apps/web/src/app/(app)/dashboard/page.tsx",
  "apps/web/src/app/(app)/settings/page.tsx",
  "apps/web/src/app/(app)/journal/page.tsx",
  "apps/web/src/app/(app)/journal/[entryId]/page.tsx",
  "apps/web/src/components/journal/journal-workspace.tsx",
  "apps/web/src/components/landing",
  "apps/chatgpt-app/src/lib/localization.ts",
  "apps/chatgpt-app/src/server.ts",
  "apps/chatgpt-app/src/tools/run-supraconscious-reflection.ts",
  "apps/mobile/lib/l10n",
  "apps/mobile/lib/src/mobile_api.dart",
  "packages/auth/src/webauthn.ts",
  "packages/db/src/pricing-content.ts",
  "packages/ai/src/active-reflection-runtime.ts",
  "packages/ai/src/avatar-system-prompt.ts",
  "packages/ai/src/generate-avatar-response.ts",
] as const

const TEXT_EXTENSIONS = new Set([".arb", ".dart", ".json", ".ts", ".tsx"])

test("active runtime and user-visible surfaces reject removed doctrine terms", () => {
  const violations: string[] = []

  for (const relativePath of ACTIVE_SURFACE_PATHS) {
    for (const filePath of listTextFiles(resolve(REPO_ROOT, relativePath))) {
      const content = readFileSync(filePath, "utf8")
      for (const term of REMOVED_PUBLIC_TERMS) {
        if (new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").test(content)) {
          violations.push(`${filePath.slice(REPO_ROOT.length + 1)}: removed term ${term}`)
        }
      }
      if (/\bMaria\s+(teaches|says|tells\s+us|believes)\b/i.test(content)) {
        violations.push(`${filePath.slice(REPO_ROOT.length + 1)}: direct Maria attribution`)
      }
    }
  }

  assert.deepEqual(violations, [])
})

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
