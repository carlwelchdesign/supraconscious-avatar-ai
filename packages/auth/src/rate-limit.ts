import "server-only"

import { headers } from "next/headers"
import { prisma } from "@inner-avatar/db"

export type AuthRateLimitScope = "web_login" | "admin_login" | "register" | "email_verification" | "password_reset"

type RateLimitConfig = {
  maxAttempts: number
  windowMs: number
}

const RATE_LIMITS: Record<AuthRateLimitScope, RateLimitConfig> = {
  web_login: { maxAttempts: 8, windowMs: 15 * 60 * 1000 },
  admin_login: { maxAttempts: 5, windowMs: 15 * 60 * 1000 },
  register: { maxAttempts: 6, windowMs: 15 * 60 * 1000 },
  email_verification: { maxAttempts: 6, windowMs: 15 * 60 * 1000 },
  password_reset: { maxAttempts: 6, windowMs: 15 * 60 * 1000 },
}

export async function isAuthRateLimited(scope: AuthRateLimitScope, email?: string | null) {
  const keys = await getRateLimitKeys(scope, email)
  const config = RATE_LIMITS[scope]
  const windowStart = getWindowStart(new Date(), config.windowMs)
  const buckets = await prisma.authRateLimitBucket.findMany({
    where: {
      scope,
      bucketKey: { in: keys },
      windowStart,
    },
    select: { count: true },
  })

  return buckets.some((bucket) => bucket.count >= config.maxAttempts)
}

export async function recordAuthFailure(scope: AuthRateLimitScope, email?: string | null) {
  const keys = await getRateLimitKeys(scope, email)
  const config = RATE_LIMITS[scope]
  const windowStart = getWindowStart(new Date(), config.windowMs)

  for (const key of keys) {
    await prisma.$executeRaw`
      INSERT INTO "AuthRateLimitBucket" ("id", "scope", "bucketKey", "windowStart", "count", "updatedAt")
      VALUES (md5(random()::text || clock_timestamp()::text), ${scope}, ${key}, ${windowStart}, 1, NOW())
      ON CONFLICT ("scope", "bucketKey", "windowStart")
      DO UPDATE SET "count" = "AuthRateLimitBucket"."count" + 1, "updatedAt" = NOW()
    `
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

function getWindowStart(now: Date, windowMs: number) {
  return new Date(Math.floor(now.getTime() / windowMs) * windowMs)
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
