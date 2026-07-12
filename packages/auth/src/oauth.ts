import "server-only"

import { createPrivateKey } from "node:crypto"
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose"
import { prisma } from "@inner-avatar/db"
import type { SessionScope, UserRole } from "@inner-avatar/types"
import { resolveSupportedLanguage } from "@inner-avatar/types/language"
import { linkFounderParticipantIfConfigured } from "./redirects"
import { createSession } from "./session"
import { createMfaPendingAuth, createPendingAuthChallenge, readPendingAuthChallenge, sanitizeRedirect, userRequiresPasskeyMfa } from "./pending-auth"

export type OAuthProvider = "google" | "apple"

type OAuthIdentity = {
  provider: OAuthProvider
  providerAccountId: string
  email: string
  emailVerified: boolean
  name?: string | null
  profile: Record<string, unknown>
}

const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"))
const appleJwks = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"))

export async function createOAuthAuthorizationUrl(input: {
  provider: OAuthProvider
  origin: string
  redirectTo?: string | null
}) {
  const state = await createPendingAuthChallenge({
    type: "oauth_state",
    authMethod: input.provider,
    redirectTo: input.redirectTo ?? "/dashboard",
    metadata: { provider: input.provider, origin: input.origin },
  })
  const redirectUri = oauthRedirectUri(input.provider, input.origin)
  const url = input.provider === "google"
    ? new URL("https://accounts.google.com/o/oauth2/v2/auth")
    : new URL("https://appleid.apple.com/auth/authorize")

  url.searchParams.set("client_id", oauthClientId(input.provider))
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", input.provider === "google" ? "openid email profile" : "openid email name")
  url.searchParams.set("state", state.token)
  url.searchParams.set("nonce", state.challenge)
  if (input.provider === "google") {
    url.searchParams.set("prompt", "select_account")
  } else {
    url.searchParams.set("response_mode", "form_post")
  }

  return url.toString()
}

export async function handleOAuthCallback(input: {
  provider: OAuthProvider
  origin: string
  code: string
  state: string
}) {
  const pendingState = await readPendingAuthChallenge({
    token: input.state,
    type: "oauth_state",
    markUsed: true,
  })
  if (!pendingState) return { ok: false as const, error: "OAuth state expired. Try signing in again." }

  const identity = await exchangeOAuthCodeForIdentity({
    provider: input.provider,
    code: input.code,
    origin: input.origin,
    nonce: pendingState.challenge,
  })

  const user = await upsertOAuthUser(identity)
  if (await userRequiresPasskeyMfa(user.id)) {
    await createMfaPendingAuth({
      userId: user.id,
      authMethod: input.provider,
      redirectTo: pendingState.redirectTo,
      scope: pendingState.scope as SessionScope,
    })
    return { ok: true as const, mfaRequired: true, redirectTo: `/mfa?next=${encodeURIComponent(sanitizeRedirect(pendingState.redirectTo))}` }
  }

  await createSession(user.id, pendingState.scope as SessionScope, { authMethod: input.provider })
  return { ok: true as const, mfaRequired: false, redirectTo: sanitizeRedirect(pendingState.redirectTo) }
}

export async function authenticateOAuthIdentity(input: {
  provider: OAuthProvider
  idToken: string
  preferredLanguage?: string | null
  scope?: SessionScope
}) {
  const identity = input.provider === "google"
    ? await verifyGoogleIdToken(input.idToken)
    : await verifyAppleIdToken(input.idToken)
  const user = await upsertOAuthUser(identity, input.preferredLanguage)

  if (await userRequiresPasskeyMfa(user.id)) {
    await createMfaPendingAuth({
      userId: user.id,
      authMethod: input.provider,
      scope: input.scope ?? "web",
    })
    return { ok: true as const, mfaRequired: true, user }
  }

  await createSession(user.id, input.scope ?? "web", { authMethod: input.provider })
  return { ok: true as const, mfaRequired: false, user }
}

async function exchangeOAuthCodeForIdentity(input: {
  provider: OAuthProvider
  code: string
  origin: string
  nonce: string
}) {
  const tokenUrl = input.provider === "google"
    ? "https://oauth2.googleapis.com/token"
    : "https://appleid.apple.com/auth/token"
  const clientSecret = input.provider === "google"
    ? requiredEnv("GOOGLE_OAUTH_CLIENT_SECRET")
    : await appleClientSecret()
  const body = new URLSearchParams({
    code: input.code,
    client_id: oauthClientId(input.provider),
    client_secret: clientSecret,
    redirect_uri: oauthRedirectUri(input.provider, input.origin),
    grant_type: "authorization_code",
  })
  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  })
  if (!response.ok) throw new Error("OAuth token exchange failed")

  const tokens = await response.json() as { id_token?: string }
  if (!tokens.id_token) throw new Error("OAuth provider did not return an identity token")

  const identity = input.provider === "google"
    ? await verifyGoogleIdToken(tokens.id_token, input.nonce)
    : await verifyAppleIdToken(tokens.id_token, input.nonce)
  return identity
}

async function verifyGoogleIdToken(idToken: string, nonce?: string): Promise<OAuthIdentity> {
  const { payload } = await jwtVerify(idToken, googleJwks, {
    issuer: ["https://accounts.google.com", "accounts.google.com"],
    audience: googleAudiences(),
  })
  if (nonce && payload.nonce && payload.nonce !== nonce) throw new Error("Google nonce mismatch")
  const email = readEmail(payload as Record<string, unknown>)
  const emailVerified = payload.email_verified === true || payload.email_verified === "true"
  if (!emailVerified) throw new Error("Google email is not verified")
  return {
    provider: "google",
    providerAccountId: String(payload.sub),
    email,
    emailVerified,
    name: typeof payload.name === "string" ? payload.name : null,
    profile: payload as Record<string, unknown>,
  }
}

async function verifyAppleIdToken(idToken: string, nonce?: string): Promise<OAuthIdentity> {
  const { payload } = await jwtVerify(idToken, appleJwks, {
    issuer: "https://appleid.apple.com",
    audience: appleAudiences(),
  })
  if (nonce && payload.nonce && payload.nonce !== nonce) throw new Error("Apple nonce mismatch")
  const email = readEmail(payload as Record<string, unknown>)
  const emailVerified = payload.email_verified === true || payload.email_verified === "true"
  if (!emailVerified) throw new Error("Apple email is not verified")
  return {
    provider: "apple",
    providerAccountId: String(payload.sub),
    email,
    emailVerified,
    name: null,
    profile: payload as Record<string, unknown>,
  }
}

async function upsertOAuthUser(identity: OAuthIdentity, preferredLanguage?: string | null) {
  const existingAccount = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: identity.provider,
        providerAccountId: identity.providerAccountId,
      },
    },
    include: { user: true },
  })
  if (existingAccount) return existingAccount.user

  const user = await prisma.user.upsert({
    where: { email: identity.email },
    update: {
      emailVerified: identity.emailVerified || undefined,
      ...(preferredLanguage ? { preferredLanguage: resolveSupportedLanguage(preferredLanguage) } : {}),
    },
    create: {
      email: identity.email,
      name: identity.name,
      passwordHash: "",
      emailVerified: identity.emailVerified,
      role: roleForEmail(identity.email),
      preferredLanguage: resolveSupportedLanguage(preferredLanguage),
    },
  })

  await prisma.oAuthAccount.create({
    data: {
      userId: user.id,
      provider: identity.provider,
      providerAccountId: identity.providerAccountId,
      email: identity.email,
      emailVerified: identity.emailVerified,
      profile: identity.profile as never,
    },
  })
  await linkFounderParticipantIfConfigured(user.id, user.email)
  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "oauth.account.linked",
      targetType: "OAuthAccount",
      reason: "Verified social login linked to account.",
      metadata: { provider: identity.provider, email: identity.email },
    },
  })

  return user
}

function oauthClientId(provider: OAuthProvider) {
  return provider === "google"
    ? requiredEnv("GOOGLE_OAUTH_CLIENT_ID")
    : requiredEnv("APPLE_OAUTH_CLIENT_ID")
}

function oauthRedirectUri(provider: OAuthProvider, origin: string) {
  return `${origin}/api/auth/oauth/${provider}/callback`
}

function googleAudiences() {
  return [
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_IOS_CLIENT_ID,
    process.env.GOOGLE_OAUTH_ANDROID_CLIENT_ID,
  ].filter(Boolean) as string[]
}

function appleAudiences() {
  return [
    process.env.APPLE_OAUTH_CLIENT_ID,
    process.env.APPLE_IOS_BUNDLE_ID,
  ].filter(Boolean) as string[]
}

async function appleClientSecret() {
  const teamId = requiredEnv("APPLE_TEAM_ID")
  const clientId = requiredEnv("APPLE_OAUTH_CLIENT_ID")
  const keyId = requiredEnv("APPLE_KEY_ID")
  const privateKey = requiredEnv("APPLE_PRIVATE_KEY").replace(/\\n/g, "\n")
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setSubject(clientId)
    .setAudience("https://appleid.apple.com")
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(createPrivateKey(privateKey))
}

function readEmail(payload: Record<string, unknown>) {
  if (typeof payload.email !== "string" || !payload.email.includes("@")) {
    throw new Error("OAuth identity token did not include an email")
  }
  return payload.email.toLowerCase()
}

function roleForEmail(email: string): UserRole {
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase()) ? "super_admin" : "user"
}

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) throw new Error(`${name} is not configured`)
  return value
}
