import assert from "node:assert/strict"
import test from "node:test"

import { evaluateRuntimeReadiness } from "../src/lib/runtime-readiness"

test("runtime readiness treats local optional services as notes", () => {
  const readiness = evaluateRuntimeReadiness({
    NODE_ENV: "development",
    OPENAI_API_KEY: "",
    SUPER_ADMIN_EMAILS: "",
  })

  assert.equal(readiness.openAiConfigured, false)
  assert.equal(readiness.superAdminConfigured, false)
  assert.equal(readiness.turnstileMode, "disabled")
  assert.deepEqual(readiness.productionBlockers, [])
  assert.ok(readiness.notes.some((note) => note.includes("Auth email delivery")))
})

test("runtime readiness blocks production without required launch configuration", () => {
  const readiness = evaluateRuntimeReadiness({
    NODE_ENV: "production",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site-only",
  })

  assert.equal(readiness.turnstileMode, "misconfigured")
  assert.ok(readiness.productionBlockers.some((blocker) => blocker.includes("OPENAI_API_KEY")))
  assert.ok(readiness.productionBlockers.some((blocker) => blocker.includes("SUPER_ADMIN_EMAILS")))
  assert.ok(readiness.productionBlockers.some((blocker) => blocker.includes("Turnstile")))
  assert.ok(readiness.productionBlockers.some((blocker) => blocker.includes("INNER_AVATAR_WEB_URL")))
})

test("runtime readiness passes production core requirements when configured", () => {
  const readiness = evaluateRuntimeReadiness({
    NODE_ENV: "production",
    OPENAI_API_KEY: "sk-live",
    SUPER_ADMIN_EMAILS: "admin@example.com",
    RESEND_API_KEY: "resend",
    AUTH_EMAIL_FROM: "noreply@example.com",
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: "site",
    TURNSTILE_SECRET_KEY: "secret",
    INNER_AVATAR_WEB_URL: "https://app.example.com",
    NEXT_PUBLIC_ADMIN_URL: "https://admin.example.com",
  })

  assert.equal(readiness.openAiConfigured, true)
  assert.equal(readiness.superAdminConfigured, true)
  assert.equal(readiness.authEmailConfigured, true)
  assert.equal(readiness.turnstileMode, "configured")
  assert.equal(readiness.handoffUrlsConfigured, true)
  assert.deepEqual(readiness.productionBlockers, [])
})
