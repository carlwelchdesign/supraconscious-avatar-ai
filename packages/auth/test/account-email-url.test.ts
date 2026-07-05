import assert from "node:assert/strict"
import test from "node:test"
import { resolveAccountEmailBaseUrl } from "../src/account-email-url"

test("account email links prefer INNER_AVATAR_WEB_URL over NEXT_PUBLIC_APP_URL", () => {
  assert.equal(
    resolveAccountEmailBaseUrl({
      innerAvatarWebUrl: "https://web.example/",
      nextPublicAppUrl: "https://fallback.example",
      forwardedHost: "request.example",
      forwardedProto: "https",
    }),
    "https://web.example",
  )
})

test("account email links fall back to NEXT_PUBLIC_APP_URL", () => {
  assert.equal(
    resolveAccountEmailBaseUrl({
      innerAvatarWebUrl: "",
      nextPublicAppUrl: "https://app.example/",
    }),
    "https://app.example",
  )
})

test("account email links use forwarded request origin when no app URL is configured", () => {
  assert.equal(
    resolveAccountEmailBaseUrl({
      forwardedHost: "forwarded.example",
      host: "internal.example",
      forwardedProto: "https",
    }),
    "https://forwarded.example",
  )
})

test("account email links fall back to localhost for scripts", () => {
  assert.equal(resolveAccountEmailBaseUrl(), "http://localhost:3000")
})
