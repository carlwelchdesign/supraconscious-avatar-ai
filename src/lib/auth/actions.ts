"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { createSession, destroySession, hashPassword, verifyPassword } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

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

    const credentialedUserCount = await prisma.user.count({
      where: { passwordHash: { not: "" } },
    })
    const user = await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: credentialedUserCount === 0 ? "admin" : "user",
      },
    })

    await createSession(user.id)
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/dashboard")
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

    await createSession(user.id)
  } catch (error) {
    return { error: authDatabaseErrorMessage(error) }
  }

  redirect("/dashboard")
}

export async function logoutAction() {
  await destroySession()
  redirect("/")
}

function authDatabaseErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("does not exist in the current database")) {
    return "Account tables are not up to date. Please run the latest database migration and try again."
  }

  return "We could not process that account request. Please try again."
}
