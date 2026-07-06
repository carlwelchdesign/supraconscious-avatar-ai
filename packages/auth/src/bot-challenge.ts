import "server-only"

import { readBotChallengeMode } from "./bot-challenge-config"
import { readClientIp } from "./client-ip"

export type BotChallengeResult = {
  ok: boolean
  reason?: string
}

export function isBotChallengeConfigured() {
  return readBotChallengeMode() === "enforced"
}

export async function verifyBotChallenge(token: string | undefined | null): Promise<BotChallengeResult> {
  const mode = readBotChallengeMode()
  if (mode === "disabled") return { ok: true }
  if (mode === "misconfigured") return { ok: false, reason: "turnstile_secret_missing" }

  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return { ok: false, reason: "turnstile_secret_missing" }

  const trimmedToken = token?.trim()
  if (!trimmedToken) return { ok: false, reason: "missing_turnstile_token" }

  const body = new URLSearchParams()
  body.set("secret", secret)
  body.set("response", trimmedToken)
  const ip = await readClientIp()
  if (ip) body.set("remoteip", ip)

  let response: Response
  try {
    response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
    })
  } catch {
    return { ok: false, reason: "turnstile_network_error" }
  }

  if (!response.ok) {
    return { ok: false, reason: `turnstile_${response.status}` }
  }

  const payload = await response.json().catch(() => null) as { success?: boolean; "error-codes"?: string[] } | null
  if (!payload?.success) {
    return { ok: false, reason: payload?.["error-codes"]?.join(",") || "turnstile_failed" }
  }

  return { ok: true }
}
