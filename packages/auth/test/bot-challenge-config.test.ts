import assert from "node:assert/strict"
import test from "node:test"
import { readBotChallengeMode } from "../src/bot-challenge-config"

test("bot challenge mode is disabled when both Turnstile keys are blank", () => {
  assert.equal(readBotChallengeMode({}), "disabled")
  assert.equal(readBotChallengeMode({ TURNSTILE_SECRET_KEY: "", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "" }), "disabled")
})

test("bot challenge mode is enforced when the server secret is configured", () => {
  assert.equal(readBotChallengeMode({ TURNSTILE_SECRET_KEY: "secret" }), "enforced")
  assert.equal(readBotChallengeMode({ TURNSTILE_SECRET_KEY: "secret", NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site" }), "enforced")
})

test("bot challenge mode is misconfigured when only the public site key is configured", () => {
  assert.equal(readBotChallengeMode({ NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site" }), "misconfigured")
})
