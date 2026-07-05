import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@inner-avatar/db"
import type { SessionScope } from "@inner-avatar/types"
import { shouldRefreshSessionLastSeen } from "./session-refresh"

const SESSION_COOKIES: Record<SessionScope, string> = {
  web: "ia_web_session",
  admin: "ia_admin_session",
}
const SESSION_DAYS = 30

export type AuthUser = Awaited<ReturnType<typeof getCurrentUser>>

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export function getSessionCookieName(scope: SessionScope = "web") {
  return SESSION_COOKIES[scope]
}

export async function createSession(userId: string, scope: SessionScope = "web") {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      scope,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(getSessionCookieName(scope), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function destroySession(scope: SessionScope = "web") {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName(scope))?.value

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token), scope },
    })
  }

  cookieStore.delete(getSessionCookieName(scope))
}

export async function getCurrentUser(scope: SessionScope = "web") {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName(scope))?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  })

  if (!session || session.scope !== scope || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    cookieStore.delete(getSessionCookieName(scope))
    return null
  }

  await refreshSessionLastSeenIfNeeded(session)

  return session.user
}

export async function getCurrentSession(scope: SessionScope = "web") {
  const cookieStore = await cookies()
  const token = cookieStore.get(getSessionCookieName(scope))?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  })

  if (!session || session.scope !== scope || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    cookieStore.delete(getSessionCookieName(scope))
    return null
  }

  await refreshSessionLastSeenIfNeeded(session)

  return session
}

export async function requireAppUser(scope: SessionScope = "web") {
  const user = await getCurrentUser(scope)
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireAdminUser() {
  const user = await requireAppUser("admin")
  if (user.role !== "admin" && user.role !== "super_admin") {
    redirect("/login")
  }
  return user
}

export async function requireSuperAdminUser() {
  const user = await requireAdminUser()
  if (user.role !== "super_admin") {
    redirect("/")
  }
  return user
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex")
}

export function constantTimeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left)
  const rightBuffer = Buffer.from(right)
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer)
}

function refreshSessionLastSeenIfNeeded(session: { id: string; lastSeenAt: Date | null }) {
  if (!shouldRefreshSessionLastSeen(session.lastSeenAt)) return Promise.resolve()
  return prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  })
}
