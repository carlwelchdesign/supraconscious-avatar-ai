import "server-only"

export type VoiceRateLimitScope = "voice_transcribe" | "voice_speak"

type RateLimitBucket = {
  attempts: number[]
}

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

const VOICE_RATE_LIMITS: Record<VoiceRateLimitScope, RateLimitConfig> = {
  voice_transcribe: { maxAttempts: 20, windowMs: 60 * 60 * 1000 },
  voice_speak: { maxAttempts: 60, windowMs: 60 * 60 * 1000 },
}

const VOICE_RATE_LIMITS_KEY = "__innerAvatarVoiceRateLimits"

type GlobalWithVoiceRateLimits = typeof globalThis & {
  [VOICE_RATE_LIMITS_KEY]?: Map<string, RateLimitBucket>
}

function getStore() {
  const globalValue = globalThis as GlobalWithVoiceRateLimits
  globalValue[VOICE_RATE_LIMITS_KEY] ??= new Map()
  return globalValue[VOICE_RATE_LIMITS_KEY]
}

export function isVoiceRateLimited(scope: VoiceRateLimitScope, userId: string) {
  const config = VOICE_RATE_LIMITS[scope]
  const now = Date.now()
  const bucket = getCleanBucket(`${scope}:user:${userId}`, config, now)
  return bucket.attempts.length >= config.maxAttempts
}

export function recordVoiceUsage(scope: VoiceRateLimitScope, userId: string) {
  const config = VOICE_RATE_LIMITS[scope]
  const now = Date.now()
  const bucket = getCleanBucket(`${scope}:user:${userId}`, config, now)
  bucket.attempts.push(now)
}

export function voiceRateLimitMessage(scope: VoiceRateLimitScope) {
  if (scope === "voice_transcribe") {
    return "Voice transcription limit reached. Please wait before recording more audio."
  }

  return "Voice playback limit reached. Please wait before generating more audio."
}

function getCleanBucket(key: string, config: RateLimitConfig, now: number) {
  const store = getStore()
  const bucket = store.get(key) ?? { attempts: [] }
  bucket.attempts = bucket.attempts.filter((timestamp) => now - timestamp < config.windowMs)
  store.set(key, bucket)
  return bucket
}
