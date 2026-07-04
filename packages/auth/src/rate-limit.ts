import "server-only"

import { headers } from "next/headers"

export type AuthRateLimitScope = "web_login" | "admin_login" | "register"

type RateLimitBucket = {
  attempts: number[]
}

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

const RATE_LIMITS: Record<AuthRateLimitScope, RateLimitConfig> = {
  web_login: { maxAttempts: 8, windowMs: 15 * 60 * 1000 },
  admin_login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  register: { maxAttempts: 6, windowMs: 15 * 60 * 1000 },
}

const AUTH_RATE_LIMITS_KEY = "__innerAvatarAuthRateLimits"

type GlobalWithRateLimits = typeof globalThis & {
  [AUTH_RATE_LIMITS_KEY]?: Map<string, RateLimitBucket>
}

function getStore() {
  const globalValue = globalThis as GlobalWithRateLimits
  globalValue[AUTH_RATE_LIMITS_KEY] ??= new Map()
  return globalValue[AUTH_RATE_LIMITS_KEY]
}

export async function isAuthRateLimited(scope: AuthRateLimitScope, email?: string | null) {
  const keys = await getRateLimitKeys(scope, email)
  const config = RATE_LIMITS[scope]
  const now = Date.now()

  return keys.some((key) => {
    const bucket = getCleanBucket(key, config, now)
    return bucket.attempts.length >= config.maxAttempts
  })
}

export async function recordAuthFailure(scope: AuthRateLimitScope, email?: string | null) {
  const keys = await getRateLimitKeys(scope, email)
  const config = RATE_LIMITS[scope]
  const now = Date.now()

  for (const key of keys) {
    const bucket = getCleanBucket(key, config, now)
    bucket.attempts.push(now)
  }
}

async function getRateLimitKeys(scope: AuthRateLimitScope, email?: string | null) {
  const ip = await readClientIp()
  const keys = [`${scope}:ip:${ip ?? "unknown"}`]
  const normalizedEmail = email?.trim().toLowerCase()

  if (normalizedEmail) {
    keys.push(`${scope}:email:${normalizedEmail}`)
  }

  return keys
}

function getCleanBucket(key: string, config: RateLimitConfig, now: number) {
  const store = getStore()
  const bucket = store.get(key) ?? { attempts: [] }
  bucket.attempts = bucket.attempts.filter((timestamp) => now - timestamp < config.windowMs)
  store.set(key, bucket)
  return bucket
}

async function readClientIp() {
  try {
    const headerStore = await headers()
    const forwardedFor = headerStore.get("x-forwarded-for")?.split(",")[0]?.trim()
    return forwardedFor || headerStore.get("x-real-ip") || headerStore.get("cf-connecting-ip") || null
  } catch {
    return null
  }
}
