import assert from "node:assert/strict"
import test from "node:test"
import { choosePostLoginRedirect } from "../src/redirect-rules"

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
