export type RuntimeReadinessEnv = {
  NODE_ENV?: string
  AUTH_SECRET?: string
  OPENAI_API_KEY?: string
  SUPER_ADMIN_EMAILS?: string
  RESEND_API_KEY?: string
  AUTH_EMAIL_FROM?: string
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  STRIPE_SECRET_KEY?: string
  STRIPE_WEBHOOK_SECRET?: string
  STRIPE_STARTER_PRICE_ID?: string
  STRIPE_PRO_PRICE_ID?: string
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?: string
  INNER_AVATAR_WEB_URL?: string
  NEXT_PUBLIC_ADMIN_URL?: string
}

export type RuntimeReadiness = {
  authSecretConfigured: boolean
  openAiConfigured: boolean
  superAdminConfigured: boolean
  authEmailConfigured: boolean
  turnstileMode: "configured" | "disabled" | "misconfigured"
  stripeConfigured: boolean
  handoffUrlsConfigured: boolean
  productionBlockers: string[]
  notes: string[]
}

export function evaluateRuntimeReadiness(env: RuntimeReadinessEnv): RuntimeReadiness {
  const authSecretConfigured = hasValue(env.AUTH_SECRET)
  const openAiConfigured = hasValue(env.OPENAI_API_KEY)
  const superAdminConfigured = hasValue(env.SUPER_ADMIN_EMAILS)
  const authEmailConfigured = hasValue(env.RESEND_API_KEY) && hasValue(env.AUTH_EMAIL_FROM)
  const turnstileMode = readTurnstileMode(env)
  const stripeConfigured = [
    env.STRIPE_SECRET_KEY,
    env.STRIPE_WEBHOOK_SECRET,
    env.STRIPE_STARTER_PRICE_ID,
    env.STRIPE_PRO_PRICE_ID,
    env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  ].every(hasValue)
  const handoffUrlsConfigured = hasValue(env.INNER_AVATAR_WEB_URL) && hasValue(env.NEXT_PUBLIC_ADMIN_URL)
  const production = env.NODE_ENV === "production"

  const productionBlockers = [
    production && !authSecretConfigured ? "AUTH_SECRET is required for production session security." : null,
    production && !openAiConfigured ? "OPENAI_API_KEY is required for production AI and voice behavior." : null,
    production && !superAdminConfigured ? "SUPER_ADMIN_EMAILS is required before the first admin login." : null,
    production && !authEmailConfigured ? "RESEND_API_KEY and AUTH_EMAIL_FROM are required for production verification and password reset email." : null,
    production && turnstileMode === "misconfigured" ? "Turnstile has a public site key or secret without its matching pair." : null,
    production && !handoffUrlsConfigured ? "INNER_AVATAR_WEB_URL and NEXT_PUBLIC_ADMIN_URL are required for production founder handoff links." : null,
  ].filter((message): message is string => Boolean(message))

  const notes = [
    authEmailConfigured ? null : "Auth email delivery is not configured; verification and reset links require manual/admin fallback.",
    turnstileMode === "configured" ? null : turnstileMode === "misconfigured"
      ? "Turnstile is misconfigured; set both public site key and server secret or leave both blank."
      : "Turnstile is disabled; server-side auth rate limits still apply.",
    stripeConfigured ? null : "Billing is disabled or incomplete; keep paid plans hidden until Stripe env vars are configured.",
    handoffUrlsConfigured ? null : "Founder handoff links are using default local URLs; set production web/admin origins before sending launch packets.",
  ].filter((message): message is string => Boolean(message))

  return {
    authSecretConfigured,
    openAiConfigured,
    superAdminConfigured,
    authEmailConfigured,
    turnstileMode,
    stripeConfigured,
    handoffUrlsConfigured,
    productionBlockers,
    notes,
  }
}

function readTurnstileMode(env: RuntimeReadinessEnv): RuntimeReadiness["turnstileMode"] {
  const siteKey = hasValue(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  const secret = hasValue(env.TURNSTILE_SECRET_KEY)
  if (siteKey && secret) return "configured"
  if (!siteKey && !secret) return "disabled"
  return "misconfigured"
}

function hasValue(value: string | undefined) {
  return Boolean(value?.trim())
}
