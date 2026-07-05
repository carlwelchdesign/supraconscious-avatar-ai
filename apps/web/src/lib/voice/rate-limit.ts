import "server-only"

import { prisma } from "@inner-avatar/db"

export type VoiceRateLimitScope = "voice_transcribe" | "voice_speak"

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

const VOICE_RATE_LIMITS: Record<VoiceRateLimitScope, RateLimitConfig> = {
  voice_transcribe: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
  voice_speak: { maxAttempts: 60, windowMs: 60 * 60 * 1000 },
}

export async function reserveVoiceUsage(scope: VoiceRateLimitScope, userId: string) {
  const config = VOICE_RATE_LIMITS[scope]
  const windowStart = getWindowStart(new Date(), config.windowMs)
  let count = 0
  let meteringUnavailable = false

  try {
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "VoiceUsageBucket" ("id", "userId", "scope", "windowStart", "count", "updatedAt")
      VALUES (md5(random()::text || clock_timestamp()::text), ${userId}, ${scope}, ${windowStart}, 1, NOW())
      ON CONFLICT ("userId", "scope", "windowStart")
      DO UPDATE SET "count" = "VoiceUsageBucket"."count" + 1, "updatedAt" = NOW()
      RETURNING "count"
    `
    count = rows[0]?.count ?? config.maxAttempts + 1
  } catch (error) {
    warnVoiceRateLimitUnavailable(error)
    meteringUnavailable = true
  }

  return {
    allowed: meteringUnavailable || count <= config.maxAttempts,
    count,
    maxAttempts: config.maxAttempts,
    meteringUnavailable,
    windowStart,
  }
}

export function voiceRateLimitMessage(scope: VoiceRateLimitScope) {
  if (scope === "voice_transcribe") {
    return "Voice transcription limit reached. Please wait before recording more audio."
  }

  return "Voice playback limit reached. Please wait before generating more audio."
}

function getWindowStart(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs)
}

let warnedVoiceRateLimitUnavailable = false

function warnVoiceRateLimitUnavailable(error: unknown) {
  if (warnedVoiceRateLimitUnavailable) return
  warnedVoiceRateLimitUnavailable = true
  console.warn(
    "Voice usage metering skipped because VoiceUsageBucket is unavailable. Run prisma generate/migrate and restart the app.",
    error,
  )
}
