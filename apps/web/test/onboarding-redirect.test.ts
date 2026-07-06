import { test } from "node:test"
import assert from "node:assert"
import { buildOnboardingLoginRedirect, buildOnboardingPath } from "../src/lib/onboarding-redirect"

test("onboarding path preserves safe post-consent destinations", () => {
  assert.equal(buildOnboardingPath("/journal"), "/onboarding?next=%2Fjournal")
  assert.equal(buildOnboardingPath("/journal/entry_123?feedback=saved"), "/onboarding?next=%2Fjournal%2Fentry_123%3Ffeedback%3Dsaved")
})

test("onboarding path drops unsafe destinations", () => {
  assert.equal(buildOnboardingPath("https://evil.example/journal"), "/onboarding")
  assert.equal(buildOnboardingPath("/admin"), "/onboarding")
})

test("onboarding login redirect preserves onboarding as the next login step", () => {
  assert.equal(
    buildOnboardingLoginRedirect("/journal"),
    "/login?next=%2Fonboarding%3Fnext%3D%252Fjournal",
  )
  assert.equal(buildOnboardingLoginRedirect(""), "/login?next=%2Fonboarding")
})
