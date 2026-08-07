import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import test from "node:test"

const activeExperienceFiles = [
  "src/components/layout/app-shell.tsx",
  "src/components/journal/journal-workspace.tsx",
  "src/components/journal/mirror-forming-state.tsx",
  "src/app/(app)/dashboard/page.tsx",
  "src/app/(app)/guide-page-content.tsx",
  "src/app/(app)/journal/[entryId]/page.tsx",
]

test("active signed-in experience does not render avatar or council-member imagery", () => {
  for (const file of activeExperienceFiles) {
    const source = readFileSync(new URL(`../${file}`, import.meta.url), "utf8")
    assert.equal(source.includes("AvatarOrb"), false, `${file} must not render AvatarOrb`)
    assert.equal(source.includes("@inner-avatar/ui/avatar-orb"), false, `${file} must not import avatar imagery`)
  }

  const workspace = readFileSync(new URL("../src/components/journal/journal-workspace.tsx", import.meta.url), "utf8")
  assert.equal(workspace.includes("councilSession"), false)

  const savedSession = readFileSync(new URL("../src/app/(app)/journal/[entryId]/page.tsx", import.meta.url), "utf8")
  assert.equal(savedSession.includes("message.displayName"), false)
  assert.equal(savedSession.includes("sessionMessages.innerCouncil"), false)
})
