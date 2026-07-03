"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSession, destroySession, hashPassword, verifyPassword } from "./session"
import { prisma } from "@inner-avatar/db"
import type { UserRole } from "@inner-avatar/types"

const RegisterSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(80),
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email").toLowerCase(),
  password: z.string().min(1, "Password is required"),
})

export type AuthActionState = {
  error?: string
}

export async function registerAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not create account." }
  }

  try {
    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    })

    if (existing) {
      return { error: "An account already exists for this email." }
    }

    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: roleForEmail(parsed.data.email),
      },
    })

    await createSession(user.id, "web")
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/onboarding")
}

export async function loginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not sign in." }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { error: "Email or password is incorrect." }
    }

    const expectedRole = roleForEmail(user.email)
    const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
      ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
      : user

    await createSession(effectiveUser.id, "web")
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/dashboard")
}

export async function logoutAction() {
  await destroySession("web")
  redirect("/")
}

export async function adminLoginAction(_state: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Could not sign in." }
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
      return { error: "Email or password is incorrect." }
    }

    const expectedRole = roleForEmail(user.email)
    const effectiveUser = expectedRole === "super_admin" && user.role !== "super_admin"
      ? await prisma.user.update({ where: { id: user.id }, data: { role: "super_admin" } })
      : user

    if (effectiveUser.role !== "admin" && effectiveUser.role !== "super_admin") {
      return { error: "Admin access is required." }
    }

    await createSession(effectiveUser.id, "admin")
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/")
}

export async function adminLogoutAction() {
  await destroySession("admin")
  redirect("/login")
}

function authDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("does not exist in the current database")) {
    return "Account tables are not up to date. Please run the latest database migration and try again."
  }

  return "We could not process that account request. Please try again."
}

function roleForEmail(email: string): UserRole {
  const allowlist = (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

  return allowlist.includes(email.toLowerCase()) ? "super_admin" : "user"
}
