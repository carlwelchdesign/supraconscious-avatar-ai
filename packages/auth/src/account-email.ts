import "server-only"

import { headers } from "next/headers"
import { randomBytes } from "node:crypto"
import { prisma } from "@inner-avatar/db"
import { resolveAccountEmailBaseUrl } from "./account-email-url"
import { sendTransactionalEmail } from "./email"
import { hashPassword, hashSessionToken } from "./session"

const EMAIL_VERIFICATION_HOURS = 24
const PASSWORD_RESET_MINUTES = 60

type UserEmailTarget = {
  id: string
  email: string
  name: string | null
}

export type AccountEmailRequestResult = {
  requested: boolean
  delivered: boolean
  provider: "resend" | "none"
  reason?: string
}

export async function requestEmailVerificationForUser(user: UserEmailTarget): Promise<AccountEmailRequestResult> {
  if (!user.email) return { requested: false, delivered: false, provider: "none", reason: "missing_email" }

  const token = createRawToken()
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_HOURS * 60 * 60 * 1000)
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      sentToEmail: user.email,
      expiresAt,
    },
  })

  const url = await buildAppUrl(`/verify-email?token=${encodeURIComponent(token)}`)
  const email = await sendTransactionalEmail({
    to: user.email,
    subject: "Verify your Supraconscious email",
    text: [
      `Hi ${user.name ?? "there"},`,
      "",
      "Verify your Supraconscious email by opening this link:",
      url,
      "",
      "This link expires in 24 hours. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      `<p>Hi ${escapeHtml(user.name ?? "there")},</p>`,
      "<p>Verify your Supraconscious email by opening this link:</p>",
      `<p><a href="${escapeHtml(url)}">Verify email</a></p>`,
      "<p>This link expires in 24 hours. If you did not request this, you can ignore this email.</p>",
    ].join(""),
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.email.verification_requested",
      targetType: "User",
      targetId: user.id,
      metadata: {
        email: user.email,
        delivered: email.delivered,
        provider: email.provider,
        reason: email.reason,
      },
    },
  })

  return { requested: true, ...email }
}

export async function requestEmailVerificationByEmail(email: string): Promise<AccountEmailRequestResult> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, email: true, name: true, emailVerified: true },
  })

  if (!user || user.emailVerified) {
    return { requested: false, delivered: false, provider: "none", reason: "not_needed" }
  }

  return requestEmailVerificationForUser(user)
}

export async function verifyEmailWithToken(rawToken: string) {
  const tokenHash = hashSessionToken(rawToken)
  const now = new Date()
  const token = await prisma.emailVerificationToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
    include: { user: true },
  })

  if (!token) {
    return { verified: false, error: "This verification link is invalid or expired." }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { emailVerified: true },
      select: { id: true },
    }),
    prisma.emailVerificationToken.update({
      where: { id: token.id },
      data: { usedAt: now },
      select: { id: true },
    }),
    prisma.auditLog.create({
      data: {
        actorId: token.userId,
        action: "user.email.verified",
        targetType: "User",
        targetId: token.userId,
        metadata: {
          email: token.user.email,
          sentToEmail: token.sentToEmail,
        },
      },
    }),
  ])

  return { verified: true }
}

export async function requestPasswordResetByEmail(email: string): Promise<AccountEmailRequestResult> {
  const user = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: { id: true, email: true, name: true },
  })

  if (!user) {
    return { requested: false, delivered: false, provider: "none", reason: "account_not_found" }
  }

  const token = createRawToken()
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_MINUTES * 60 * 1000)
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt,
    },
  })

  const url = await buildAppUrl(`/reset-password?token=${encodeURIComponent(token)}`)
  const emailResult = await sendTransactionalEmail({
    to: user.email,
    subject: "Reset your Supraconscious password",
    text: [
      `Hi ${user.name ?? "there"},`,
      "",
      "Reset your Supraconscious password by opening this link:",
      url,
      "",
      "This link expires in 60 minutes. If you did not request this, you can ignore this email.",
    ].join("\n"),
    html: [
      `<p>Hi ${escapeHtml(user.name ?? "there")},</p>`,
      "<p>Reset your Supraconscious password by opening this link:</p>",
      `<p><a href="${escapeHtml(url)}">Reset password</a></p>`,
      "<p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>",
    ].join(""),
  })

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "user.password.reset_requested",
      targetType: "User",
      targetId: user.id,
      metadata: {
        delivered: emailResult.delivered,
        provider: emailResult.provider,
        reason: emailResult.reason,
      },
    },
  })

  return { requested: true, ...emailResult }
}

export async function resetPasswordWithToken(rawToken: string, password: string) {
  const tokenHash = hashSessionToken(rawToken)
  const now = new Date()
  const token = await prisma.passwordResetToken.findFirst({
    where: {
      tokenHash,
      usedAt: null,
      expiresAt: { gt: now },
    },
  })

  if (!token) {
    return { reset: false, error: "This password reset link is invalid or expired." }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: token.userId },
      data: { passwordHash: await hashPassword(password) },
      select: { id: true },
    }),
    prisma.passwordResetToken.update({
      where: { id: token.id },
      data: { usedAt: now },
      select: { id: true },
    }),
    prisma.session.deleteMany({
      where: { userId: token.userId },
    }),
    prisma.auditLog.create({
      data: {
        actorId: token.userId,
        action: "user.password.reset_completed",
        targetType: "User",
        targetId: token.userId,
      },
    }),
  ])

  return { reset: true }
}

function createRawToken() {
  return randomBytes(32).toString("base64url")
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

async function buildAppUrl(path: string) {
  try {
    const headerStore = await headers()
    return `${resolveAccountEmailBaseUrl({
      innerAvatarWebUrl: process.env.INNER_AVATAR_WEB_URL,
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
      forwardedHost: headerStore.get("x-forwarded-host"),
      host: headerStore.get("host"),
      forwardedProto: headerStore.get("x-forwarded-proto"),
    })}${path}`
  } catch {
    // Scripts may call this outside a request.
  }

  return `${resolveAccountEmailBaseUrl({
    innerAvatarWebUrl: process.env.INNER_AVATAR_WEB_URL,
    nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL,
  })}${path}`
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}
