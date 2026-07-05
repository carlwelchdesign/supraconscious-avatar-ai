import assert from "node:assert/strict"
import test from "node:test"
import { hasRequiredPilotConsents, PILOT_CONSENT_VERSION } from "../src/consent"
import { choosePostLoginRedirect } from "../src/redirect-rules"
import { choosePostAuthRedirect, choosePostRegistrationRedirect, readSafeNextPath } from "../src/safe-redirect"

test("post-login redirect sends incomplete onboarding to onboarding", () => {
  assert.equal(
    choosePostLoginRedirect({
      onboardingComplete: false,
      hasRequiredPilotConsents: false,
      isFounderParticipant: true,
      councilSessionCount: 0,
    }),
    "/onboarding",
  )
})

test("post-login redirect sends missing consent records to onboarding", () => {
  assert.equal(
    choosePostLoginRedirect({
      onboardingComplete: true,
      hasRequiredPilotConsents: false,
      isFounderParticipant: true,
      councilSessionCount: 0,
    }),
    "/onboarding",
  )
})

test("post-login redirect sends first-session founders to journal", () => {
  assert.equal(
    choosePostLoginRedirect({
      onboardingComplete: true,
      hasRequiredPilotConsents: true,
      isFounderParticipant: true,
      councilSessionCount: 0,
    }),
    "/journal",
  )
})

test("post-login redirect sends founders with sessions to dashboard", () => {
  assert.equal(
    choosePostLoginRedirect({
      onboardingComplete: true,
      hasRequiredPilotConsents: true,
      isFounderParticipant: true,
      councilSessionCount: 1,
    }),
    "/dashboard",
  )
})

test("post-login redirect sends non-founder users to dashboard", () => {
  assert.equal(
    choosePostLoginRedirect({
      onboardingComplete: true,
      hasRequiredPilotConsents: true,
      isFounderParticipant: false,
      councilSessionCount: 0,
    }),
    "/dashboard",
  )
})

test("required pilot consent uses the latest event per consent type", () => {
  assert.equal(
    hasRequiredPilotConsents([
      { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
      { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: false, createdAt: "2026-07-02T00:00:00.000Z" },
      { consentType: "ai_processing", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
      { consentType: "pilot_participation", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
      { consentType: "safety_limits", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
    ]),
    false,
  )

  assert.equal(
    hasRequiredPilotConsents([
      { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: false, createdAt: "2026-07-01T00:00:00.000Z" },
      { consentType: "privacy_terms", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-02T00:00:00.000Z" },
      { consentType: "ai_processing", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
      { consentType: "pilot_participation", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
      { consentType: "safety_limits", consentVersion: PILOT_CONSENT_VERSION, granted: true, createdAt: "2026-07-01T00:00:00.000Z" },
    ]),
    true,
  )
})

test("safe next paths reject external or unsafe redirects", () => {
  assert.equal(readSafeNextPath("/journal"), "/journal")
  assert.equal(readSafeNextPath("/journal/session_123"), "/journal/session_123")
  assert.equal(readSafeNextPath("/journal/session_123?feedback=saved"), "/journal/session_123?feedback=saved")
  assert.equal(readSafeNextPath("/journal?from=handoff"), "/journal?from=handoff")
  assert.equal(readSafeNextPath("https://evil.example/journal"), "")
  assert.equal(readSafeNextPath("//evil.example/journal"), "")
  assert.equal(readSafeNextPath("/admin"), "")
})

test("post-auth redirect honors safe next only after onboarding gates", () => {
  assert.equal(choosePostAuthRedirect("/onboarding", "/journal"), "/onboarding")
  assert.equal(choosePostAuthRedirect("/onboarding", "/onboarding"), "/onboarding")
  assert.equal(choosePostAuthRedirect("/dashboard", "/journal"), "/journal")
  assert.equal(choosePostAuthRedirect("/dashboard", "/journal/session_123"), "/journal/session_123")
  assert.equal(choosePostAuthRedirect("/dashboard", "https://evil.example"), "/dashboard")
})

test("post-registration redirect preserves only onboarding-safe next paths", () => {
  assert.equal(choosePostRegistrationRedirect("/onboarding?from=handoff"), "/onboarding?from=handoff")
  assert.equal(choosePostRegistrationRedirect("/journal"), "/onboarding")
  assert.equal(choosePostRegistrationRedirect("https://evil.example/onboarding"), "/onboarding")
})
