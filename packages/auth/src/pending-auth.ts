import "server-only"

import { cookies } from "next/headers"
import { createHash, randomBytes } from "node:crypto"
import { prisma } from "@inner-avatar/db"
import type { SessionScope } from "@inner-avatar/types"

export const PENDING_AUTH_COOKIE = "ia_pending_auth"
const PENDING_AUTH_MINUTES = 10

export type PendingAuthType =
  | "oauth_state"
  | "mfa"
  | "webauthn_registration"
  | "webauthn_authentication"

export function randomAuthToken() {
  return randomBytes(32).toString("base64url")
}

export function hashAuthToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export async function createPendingAuthChallenge(input: {
  userId?: string | null
  type: PendingAuthType
  scope?: SessionScope
  authMethod?: string | null
  challenge?: string
  redirectTo?: string
  metadata?: Record<string, unknown>
  setCookie?: boolean
}) {
  const token = randomAuthToken()
  const expiresAt = new Date(Date.now() + PENDING_AUTH_MINUTES * 60 * 1000)
  const challenge = input.challenge ?? randomAuthToken()

  const record = await prisma.pendingAuthChallenge.create({
    data: {
      userId: input.userId ?? null,
      tokenHash: hashAuthToken(token),
      type: input.type,
      scope: input.scope ?? "web",
      authMethod: input.authMethod ?? null,
      challenge,
      redirectTo: sanitizeRedirect(input.redirectTo),
      metadata: (input.metadata ?? {}) as never,
      expiresAt,
    },
  })

  if (input.setCookie) {
    const cookieStore = await cookies()
    cookieStore.set(PENDING_AUTH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    })
  }

  return { token, challenge, record }
}

export async function readPendingAuthChallenge(input: {
  token?: string | null
  type?: PendingAuthType
  markUsed?: boolean
}) {
  const token = input.token ?? (await cookies()).get(PENDING_AUTH_COOKIE)?.value
  if (!token) return null

  const record = await prisma.pendingAuthChallenge.findUnique({
    where: { tokenHash: hashAuthToken(token) },
  })
  if (!record || record.usedAt || record.expiresAt <= new Date()) return null
  if (input.type && record.type !== input.type) return null

  if (input.markUsed) {
    await prisma.pendingAuthChallenge.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    })
  }

  return record
}

export async function clearPendingAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(PENDING_AUTH_COOKIE)
}

export async function createMfaPendingAuth(input: {
  userId: string
  authMethod: string
  redirectTo?: string
  scope?: SessionScope
}) {
  return createPendingAuthChallenge({
    userId: input.userId,
    type: "mfa",
    scope: input.scope ?? "web",
    authMethod: input.authMethod,
    redirectTo: input.redirectTo,
    setCookie: true,
  })
}

export async function userRequiresPasskeyMfa(userId: string) {
  const count = await prisma.webAuthnCredential.count({ where: { userId } })
  return count > 0
}

export function buildMfaRequiredResponse() {
  return {
    authenticated: false,
    status: "mfa_required" as const,
    user: null,
    mfa: {
      methods: ["passkey", "recovery_code"],
    },
  }
}

export function sanitizeRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/dashboard"
  return value
}
