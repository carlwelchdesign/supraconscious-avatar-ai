import { test } from "node:test"
import assert from "node:assert"
import { normalizeOrigin, resolveFirstPartyAppOrigin } from "../src/lib/app-origin"

test("normalizeOrigin strips paths and rejects invalid URLs", () => {
  assert.equal(normalizeOrigin("https://app.example.com/settings?x=1"), "https://app.example.com")
  assert.equal(normalizeOrigin("not a url"), null)
})

test("first-party app origin rejects unconfigured external origins", () => {
  const origin = resolveFirstPartyAppOrigin({
    requestOrigin: "https://evil.example",
    requestHost: "evil.example",
    configuredOrigin: "https://app.example.com",
    nodeEnv: "production",
  })

  assert.equal(origin, "https://app.example.com")
})

test("first-party app origin accepts configured production origin", () => {
  const origin = resolveFirstPartyAppOrigin({
    requestOrigin: "https://app.example.com/pricing",
    requestHost: "ignored.example",
    configuredOrigin: "https://app.example.com",
    nodeEnv: "production",
  })

  assert.equal(origin, "https://app.example.com")
})

test("first-party app origin permits localhost only outside production", () => {
  assert.equal(
    resolveFirstPartyAppOrigin({
      requestOrigin: "http://localhost:3000",
      configuredOrigin: "https://app.example.com",
      nodeEnv: "development",
    }),
    "http://localhost:3000",
  )
  assert.equal(
    resolveFirstPartyAppOrigin({
      requestOrigin: "http://localhost:3000",
      configuredOrigin: "https://app.example.com",
      nodeEnv: "production",
    }),
    "https://app.example.com",
  )
})
