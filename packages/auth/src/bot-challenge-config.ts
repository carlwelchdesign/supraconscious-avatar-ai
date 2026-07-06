export type BotChallengeMode = "disabled" | "enforced" | "misconfigured"

export type BotChallengeEnv = {
  TURNSTILE_SECRET_KEY?: string
  NEXT_PUBLIC_TURNSTILE_SITE_KEY?: string
  [key: string]: string | undefined
}

export function readBotChallengeMode(env: BotChallengeEnv = process.env): BotChallengeMode {
  const secretConfigured = Boolean(env.TURNSTILE_SECRET_KEY?.trim())
  const siteKeyConfigured = Boolean(env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim())

  if (secretConfigured) return "enforced"
  if (siteKeyConfigured) return "misconfigured"
  return "disabled"
}
