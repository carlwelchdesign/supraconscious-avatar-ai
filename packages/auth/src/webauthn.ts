import "server-only"

import { createHash, randomBytes } from "node:crypto"
import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
  type AuthenticationResponseJSON,
  type RegistrationResponseJSON,
} from "@simplewebauthn/server"
import { prisma } from "@inner-avatar/db"
import type { SessionScope } from "@inner-avatar/types"
import { createSession } from "./session"
import {
  clearPendingAuthCookie,
  createPendingAuthChallenge,
  readPendingAuthChallenge,
  sanitizeRedirect,
} from "./pending-auth"

const RP_NAME = "Supraconscious Inner Council"

export async function startPasskeyRegistration(input: {
  userId: string
  userEmail: string
  userName?: string | null
  origin: string
}) {
  const credentials = await prisma.webAuthnCredential.findMany({
    where: { userId: input.userId },
    select: { credentialId: true, transports: true },
  })
  const rpID = webAuthnRpId(input.origin)
  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userName: input.userEmail,
    userDisplayName: input.userName ?? input.userEmail,
    attestationType: "none",
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "required",
    },
    excludeCredentials: credentials.map((credential) => ({
      id: credential.credentialId,
      transports: credential.transports as never,
    })),
  })
  const pending = await createPendingAuthChallenge({
    userId: input.userId,
    type: "webauthn_registration",
    challenge: options.challenge,
    metadata: { rpID, origin: input.origin },
  })

  return { options, challengeToken: pending.token }
}

export async function finishPasskeyRegistration(input: {
  userId: string
  challengeToken: string
  response: RegistrationResponseJSON
  origin: string
  deviceLabel?: string
}) {
  const pending = await readPendingAuthChallenge({
    token: input.challengeToken,
    type: "webauthn_registration",
    markUsed: true,
  })
  if (!pending || pending.userId !== input.userId) {
    return { ok: false as const, error: "Passkey registration expired. Try again." }
  }

  const rpID = readRpIdFromMetadata(pending.metadata) ?? webAuthnRpId(input.origin)
  const verification = await verifyRegistrationResponse({
    response: input.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: expectedOrigins(input.origin),
    expectedRPID: rpID,
    requireUserVerification: true,
  })

  if (!verification.verified) {
    return { ok: false as const, error: "Passkey registration could not be verified." }
  }

  const credential = verification.registrationInfo.credential
  const savedCredential = await prisma.webAuthnCredential.create({
    data: {
      userId: input.userId,
      credentialId: credential.id,
      publicKey: Buffer.from(credential.publicKey),
      counter: BigInt(credential.counter),
      transports: credential.transports ?? [],
      deviceLabel: input.deviceLabel?.trim() || "Security key",
      backedUp: verification.registrationInfo.credentialBackedUp,
      credentialDeviceType: verification.registrationInfo.credentialDeviceType,
    },
  })
  const recoveryCodes = await ensureRecoveryCodes(input.userId)
  await audit(input.userId, "webauthn.credential.enrolled", "WebAuthnCredential", savedCredential.id, {
    credentialId: credential.id,
    credentialDeviceType: verification.registrationInfo.credentialDeviceType,
    backedUp: verification.registrationInfo.credentialBackedUp,
  })

  return {
    ok: true as const,
    credential: savedCredential,
    recoveryCodes,
  }
}

export async function startPasskeyAuthentication(input: {
  userId?: string
  origin: string
  scope?: SessionScope
}) {
  const credentials = input.userId
    ? await prisma.webAuthnCredential.findMany({
        where: { userId: input.userId },
        select: { credentialId: true, transports: true },
      })
    : []
  const rpID = webAuthnRpId(input.origin)
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "required",
    allowCredentials: credentials.length
      ? credentials.map((credential) => ({
          id: credential.credentialId,
          transports: credential.transports as never,
        }))
      : undefined,
  })
  const pending = await createPendingAuthChallenge({
    userId: input.userId,
    type: "webauthn_authentication",
    scope: input.scope ?? "web",
    challenge: options.challenge,
    metadata: { rpID, origin: input.origin },
  })

  return { options, challengeToken: pending.token }
}

export async function finishPendingPasskeyMfa(input: {
  challengeToken: string
  response: AuthenticationResponseJSON
  origin: string
}) {
  const pendingMfa = await readPendingAuthChallenge({ type: "mfa" })
  if (!pendingMfa?.userId) {
    return { ok: false as const, error: "Your sign-in challenge expired. Please sign in again." }
  }

  const result = await finishPasskeyAuthentication({
    userId: pendingMfa.userId,
    challengeToken: input.challengeToken,
    response: input.response,
    origin: input.origin,
  })
  if (!result.ok) return result

  await createSession(pendingMfa.userId, pendingMfa.scope as SessionScope, {
    authMethod: pendingMfa.authMethod ?? "password",
    mfaMethod: "passkey",
    mfaVerifiedAt: new Date(),
  })
  await readPendingAuthChallenge({ type: "mfa", markUsed: true })
  await clearPendingAuthCookie()

  return { ok: true as const, redirectTo: sanitizeRedirect(pendingMfa.redirectTo) }
}

export async function finishPasskeyAuthentication(input: {
  userId: string
  challengeToken: string
  response: AuthenticationResponseJSON
  origin: string
}) {
  const pending = await readPendingAuthChallenge({
    token: input.challengeToken,
    type: "webauthn_authentication",
    markUsed: true,
  })
  if (!pending || (pending.userId && pending.userId !== input.userId)) {
    return { ok: false as const, error: "Passkey challenge expired. Try again." }
  }

  const credential = await prisma.webAuthnCredential.findFirst({
    where: { userId: input.userId, credentialId: input.response.id },
  })
  if (!credential) {
    return { ok: false as const, error: "This passkey is not enrolled for the account." }
  }

  const rpID = readRpIdFromMetadata(pending.metadata) ?? webAuthnRpId(input.origin)
  const verification = await verifyAuthenticationResponse({
    response: input.response,
    expectedChallenge: pending.challenge,
    expectedOrigin: expectedOrigins(input.origin),
    expectedRPID: rpID,
    requireUserVerification: true,
    credential: {
      id: credential.credentialId,
      publicKey: new Uint8Array(credential.publicKey),
      counter: Number(credential.counter),
      transports: credential.transports as never,
    },
  })

  if (!verification.verified) {
    await audit(input.userId, "webauthn.authentication.failed", "WebAuthnCredential", credential.id)
    return { ok: false as const, error: "Passkey verification failed." }
  }

  await prisma.webAuthnCredential.update({
    where: { id: credential.id },
    data: {
      counter: BigInt(verification.authenticationInfo.newCounter),
      backedUp: verification.authenticationInfo.credentialBackedUp,
      credentialDeviceType: verification.authenticationInfo.credentialDeviceType,
      lastUsedAt: new Date(),
    },
  })
  await audit(input.userId, "webauthn.authentication.succeeded", "WebAuthnCredential", credential.id)
  return { ok: true as const }
}

export async function listPasskeys(userId: string) {
  return prisma.webAuthnCredential.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      deviceLabel: true,
      createdAt: true,
      lastUsedAt: true,
      backedUp: true,
      credentialDeviceType: true,
      transports: true,
    },
  })
}

export async function removePasskey(input: { userId: string; credentialId: string; recoveryCode?: string }) {
  const count = await prisma.webAuthnCredential.count({ where: { userId: input.userId } })
  if (count <= 1) {
    if (!input.recoveryCode || !(await consumeRecoveryCode(input.userId, input.recoveryCode))) {
      return { ok: false as const, error: "Enter a valid recovery code before removing your last passkey." }
    }
  }

  const deleted = await prisma.webAuthnCredential.deleteMany({
    where: { id: input.credentialId, userId: input.userId },
  })
  if (!deleted.count) return { ok: false as const, error: "Passkey not found." }

  await audit(input.userId, "webauthn.credential.removed", "WebAuthnCredential", input.credentialId)
  return { ok: true as const }
}

export async function renamePasskey(input: { userId: string; credentialId: string; deviceLabel: string }) {
  const credential = await prisma.webAuthnCredential.updateMany({
    where: { id: input.credentialId, userId: input.userId },
    data: { deviceLabel: input.deviceLabel.trim().slice(0, 80) || "Security key" },
  })
  return { ok: credential.count > 0 }
}

export async function finishPendingMfaWithRecoveryCode(code: string) {
  const pendingMfa = await readPendingAuthChallenge({ type: "mfa" })
  if (!pendingMfa?.userId) {
    return { ok: false as const, error: "Your sign-in challenge expired. Please sign in again." }
  }
  if (!(await consumeRecoveryCode(pendingMfa.userId, code))) {
    await audit(pendingMfa.userId, "recovery_code.failed", "User", pendingMfa.userId)
    return { ok: false as const, error: "Recovery code is invalid or already used." }
  }

  await createSession(pendingMfa.userId, pendingMfa.scope as SessionScope, {
    authMethod: pendingMfa.authMethod ?? "recovery",
    mfaMethod: "recovery_code",
    mfaVerifiedAt: new Date(),
  })
  await audit(pendingMfa.userId, "recovery_code.used", "User", pendingMfa.userId)
  await readPendingAuthChallenge({ type: "mfa", markUsed: true })
  await clearPendingAuthCookie()
  return { ok: true as const, redirectTo: sanitizeRedirect(pendingMfa.redirectTo) }
}

async function ensureRecoveryCodes(userId: string) {
  const existing = await prisma.recoveryCode.count({ where: { userId, usedAt: null } })
  if (existing > 0) return []

  const codes = Array.from({ length: 10 }, () => formatRecoveryCode(randomBytes(10).toString("base64url")))
  await prisma.recoveryCode.createMany({
    data: codes.map((code) => ({
      userId,
      codeHash: hashRecoveryCode(code),
    })),
  })
  return codes
}

async function consumeRecoveryCode(userId: string, code: string) {
  const codeHash = hashRecoveryCode(code)
  const result = await prisma.recoveryCode.updateMany({
    where: { userId, codeHash, usedAt: null },
    data: { usedAt: new Date() },
  })
  return result.count > 0
}

function hashRecoveryCode(code: string) {
  return createHash("sha256").update(code.replaceAll("-", "").trim().toLowerCase()).digest("hex")
}

function formatRecoveryCode(value: string) {
  const compact = value.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16).toLowerCase()
  return compact.match(/.{1,4}/g)?.join("-") ?? compact
}

function webAuthnRpId(origin: string) {
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID
  const host = new URL(origin).hostname
  return host
}

function expectedOrigins(origin: string) {
  const configured = (process.env.WEBAUTHN_EXPECTED_ORIGINS ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return configured.length ? configured : [origin]
}

function readRpIdFromMetadata(metadata: unknown) {
  return metadata && typeof metadata === "object" && "rpID" in metadata && typeof metadata.rpID === "string"
    ? metadata.rpID
    : null
}

async function audit(
  actorId: string,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata?: Record<string, unknown>,
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      reason: "Authentication security event.",
      metadata: (metadata ?? {}) as never,
    },
  })
}
