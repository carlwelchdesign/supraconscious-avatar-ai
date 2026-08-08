import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const reportFiles = [
  "packages/ai/src/founder-calibration-report.ts",
  "packages/ai/src/founder-calibration-comparison.ts",
  "packages/ai/src/founder-calibration-setup-report.ts",
]

test("administrative calibration reports never read raw journal content", async () => {
  for (const file of reportFiles) {
    const source = await readFile(file, "utf8")
    assert.equal(/\brawText\b|\bjournalText\b/.test(source), false, `${file} accesses journal content`)
  }
})

test("raw safety reveal requires super-admin authorization and remains audited", async () => {
  const source = await readFile("apps/admin/src/app/(admin)/safety/actions.ts", "utf8")
  const revealStart = source.indexOf("export async function revealFlaggedEntryAction")
  const resolveStart = source.indexOf("export async function resolveSafetyEventAction")
  const revealAction = source.slice(revealStart, resolveStart)

  assert.ok(revealAction.includes("requireSuperAdminUser()"))
  assert.ok(revealAction.includes('action: "journal_entry.reveal"'))
  assert.ok(revealAction.includes("buildSafetyRevealAuditMetadata"))
  assert.ok(revealAction.includes("reason: parsed.data.reason"))
})
