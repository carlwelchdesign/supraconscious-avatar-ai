import assert from "node:assert/strict"
import test from "node:test"
import { readFileSync } from "node:fs"

const read = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")

test("completed reflection separates member, Guide, source, and member-action evidence", () => {
  const page = read("src/app/(app)/journal/[entryId]/page.tsx")
  assert.match(page, /tone="member"/)
  assert.match(page, /tone="guide"/)
  assert.match(page, /tone="source"/)
  assert.match(page, /tone="action"/)
  assert.match(page, /ProvenanceLine/)
  assert.match(page, /MemberActionEditor/)
  assert.doesNotMatch(page, /confidence/i)
})

test("selected dimensions are equal, tentative, correctable, and restorable", () => {
  const evidence = read("src/components/reflection/reflection-evidence.tsx")
  const actions = read("src/components/reflection/correction-actions.tsx")
  assert.match(evidence, /selectionLabel/)
  assert.match(evidence, /interpretationLabel/)
  assert.match(actions, /correctionType/)
  assert.match(actions, /correctionText/)
  assert.match(actions, /save\("correct", correctionText\)/)
  assert.match(actions, /memberCorrection/)
  assert.match(actions, /method: "DELETE"/)
  assert.match(actions, /aria-live="polite"/)
  assert.doesNotMatch(evidence, /confidence|score|rank/i)
})

test("reflection corrections and restores remain owner scoped", () => {
  const route = read("src/app/api/reflections/corrections/route.ts")
  assert.match(route, /requireJournalAccessUser/)
  assert.match(route, /userId: user\.id/)
  assert.match(route, /disabledAt: null, deletedAt: null/)
})
