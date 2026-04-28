import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { createHash, randomBytes, timingSafeEqual } from "node:crypto"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"

const SESSION_COOKIE = "inner_avatar_session"
const SESSION_DAYS = 30

export type AuthUser = Awaited<ReturnType<typeof getCurrentUser>>

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, passwordHash: string) {
  return bcrypt.compare(password, passwordHash)
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url")
  const tokenHash = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  })

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  })
}

export async function destroySession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashSessionToken(token) },
    })
  }

  cookieStore.delete(SESSION_COOKIE)
}

export async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  })

  if (!session || session.expiresAt <= new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } })
    }
    cookieStore.delete(SESSION_COOKIE)
    return null
  }

  await prisma.session.update({
    where: { id: session.id },
    data: { lastSeenAt: new Date() },
  })

  return session.user
}

export async function requireAppUser() {
  const user = await getCurrentUser()
  if (!user) {
    redirect("/login")
  }
  return user
}

export async function requireAdminUser() {
  const user = await requireAppUser()
  if (user.role !== "admin") {
    redirect("/dashboard")
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
