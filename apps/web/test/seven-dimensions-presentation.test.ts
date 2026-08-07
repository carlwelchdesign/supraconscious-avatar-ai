import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const readWebSource = (path: string) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8")

test("active web surfaces do not present user or Guide progression", () => {
  const dashboard = readWebSource("src/app/(app)/dashboard/page.tsx")
  const workspace = readWebSource("src/components/journal/journal-workspace.tsx")
  const guide = readWebSource("src/app/(app)/guide-page-content.tsx")

  assert.equal(dashboard.includes("currentLevel"), false)
  assert.equal(dashboard.includes("levelNames"), false)
  assert.equal(workspace.includes("enteringLevel"), false)
  assert.equal(workspace.includes("result?.progression"), false)
  assert.equal(guide.includes("Progression"), false)
  assert.equal(guide.includes("level up"), false)
})

test("Seven Dimensions presentation preserves equal meaning and the Observer vantage", () => {
  const guide = readWebSource("src/app/(app)/guide-page-content.tsx")
  const rationalePanel = readWebSource("src/components/journal/dimension-rationale-panel.tsx")
  const messages = JSON.parse(readWebSource("src/messages/en.json"))

  assert.match(guide, /equally available facets/)
  assert.match(guide, /neither failed nor skipped/)
  assert.match(guide, /aria-describedby="seven-dimensions-description"/)
  assert.match(rationalePanel, /dimensionSelectionContext/)
  assert.match(rationalePanel, /dimensionSelectedLabel/)
  assert.match(rationalePanel, /aria-describedby=\{descriptionId\}/)
  assert.match(messages.journal.dimensionDescriptions.story, /Observer vantage/)
  assert.deepEqual(Object.keys(messages.journal.dimensionNames), [
    "perception",
    "story",
    "fear",
    "ego",
    "genius",
    "supraconscious",
    "embodiment",
  ])
})

test("mobile Guide removes the progression scorecard while retaining equal dimension cards", () => {
  const mobileApp = readFileSync(new URL("../../mobile/lib/src/app.dart", import.meta.url), "utf8")

  assert.equal(mobileApp.includes("_StatCard(label: 'Progression'"), false)
  assert.match(mobileApp, /for \(final dimension in data\.dimensions\)/)
})
