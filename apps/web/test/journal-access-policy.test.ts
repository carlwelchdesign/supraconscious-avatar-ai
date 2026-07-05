import { test } from "node:test"
import assert from "node:assert"
import { PILOT_CONSENT_VERSION, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import { evaluateJournalAccess } from "../src/lib/journal-access-policy"

test("journal access rejects unauthenticated API callers", () => {
  const decision = evaluateJournalAccess(null)

  assert.equal(decision.allowed, false)
  if (!decision.allowed) {
    assert.equal(decision.status, 401)
    assert.equal(decision.code, "unauthorized")
  }
})

test("journal access requires onboarding before consent checks", () => {
  const decision = evaluateJournalAccess({ onboardingComplete: false }, requiredConsentRecords())

  assert.equal(decision.allowed, false)
  if (!decision.allowed) {
    assert.equal(decision.status, 403)
    assert.equal(decision.code, "onboarding_required")
  }
})

test("journal access requires current required pilot consents", () => {
  const missingConsent = evaluateJournalAccess({ onboardingComplete: true }, [])
  const staleConsent = evaluateJournalAccess(
    { onboardingComplete: true },
    requiredConsentRecords("older-consent-version"),
  )

  assert.equal(missingConsent.allowed, false)
  if (!missingConsent.allowed) assert.equal(missingConsent.code, "consent_required")
  assert.equal(staleConsent.allowed, false)
  if (!staleConsent.allowed) assert.equal(staleConsent.code, "consent_required")
})

test("journal access allows onboarded users with current required consent", () => {
  const decision = evaluateJournalAccess({ onboardingComplete: true }, requiredConsentRecords())

  assert.deepEqual(decision, { allowed: true })
})

function requiredConsentRecords(consentVersion = PILOT_CONSENT_VERSION) {
  return REQUIRED_PILOT_CONSENTS.map((consentType, index) => ({
    consentType,
    consentVersion,
    granted: true,
    createdAt: new Date(Date.UTC(2026, 0, index + 1)),
  }))
}
