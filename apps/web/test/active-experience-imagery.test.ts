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

test("approved Observatory mineral boundary replaces the retired eye artwork", () => {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8")
  const landing = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8")
  const mobile = readFileSync(new URL("../../mobile/lib/src/app.dart", import.meta.url), "utf8")

  assert.match(css, /mineral-boundary-v3-wide\.png/)
  assert.match(landing, /mineral-boundary-v3-wide\.png/)
  assert.match(mobile, /mineral-boundary-v3-portrait\.png/)
  assert.equal(css.includes("echo-eye-cosmos"), false)
  assert.equal(landing.includes("echo-eye-cosmos"), false)
  assert.equal(mobile.includes("echo-eye-cosmos"), false)
  assert.equal(/mirror-forming-orbit|mirror-forming-ring|mirror-forming-orb/i.test(css), false)
})
