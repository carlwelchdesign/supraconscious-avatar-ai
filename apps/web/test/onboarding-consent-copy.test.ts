import test from "node:test"
import assert from "node:assert/strict"
import { ONBOARDING_CONSENT_ITEMS, readOnboardingConsentRequirementLabel } from "../src/lib/onboarding-consent-copy"

test("onboarding consent copy makes pattern memory clearly optional", () => {
  const patternMemory = ONBOARDING_CONSENT_ITEMS.find(([name]) => name === "pattern_memory")

  assert.ok(patternMemory)
  assert.equal(patternMemory[2], false)
  assert.match(patternMemory[1], /Optionally remember recurring signals/)
  assert.match(patternMemory[1], /turn this off later/)
})

test("onboarding consent requirement labels are explicit", () => {
  assert.equal(readOnboardingConsentRequirementLabel(true), "Required")
  assert.equal(readOnboardingConsentRequirementLabel(false), "Optional")
})
