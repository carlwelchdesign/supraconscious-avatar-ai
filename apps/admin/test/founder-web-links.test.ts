import test from "node:test"
import assert from "node:assert/strict"
import { resolveFounderWebHref } from "../src/lib/founder-web-links"

test("founder web links send protected journal paths through login with next destination", () => {
  assert.equal(
    resolveFounderWebHref("/journal/entry_123", "https://app.example.com", "carl@example.com"),
    "https://app.example.com/login?email=carl%40example.com&next=%2Fjournal%2Fentry_123",
  )
})

test("founder web links send onboarding through login with journal as the next post-onboarding destination", () => {
  assert.equal(
    resolveFounderWebHref("/onboarding", "https://app.example.com", "maria@example.com"),
    "https://app.example.com/login?email=maria%40example.com&next=%2Fonboarding%3Fnext%3D%252Fjournal",
  )
})

test("founder web links prefill email for public auth links and leave admin paths untouched", () => {
  assert.equal(
    resolveFounderWebHref("/register", "https://app.example.com", "maria@example.com"),
    "https://app.example.com/register?email=maria%40example.com",
  )
  assert.equal(resolveFounderWebHref("/calibration/live", "https://app.example.com", "maria@example.com"), "/calibration/live")
})
