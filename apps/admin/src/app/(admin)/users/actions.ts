"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { hashPassword, requireSuperAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { hashEmailForAudit } from "@/lib/audit-metadata"

const ResetUserPasswordSchema = z.object({
  userId: z.string().min(1),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters.").max(128),
  reason: z.string().trim().min(10, "A password reset reason is required."),
})

const UpdateEmailVerificationSchema = z.object({
  userId: z.string().min(1),
  emailVerified: z.enum(["true", "false"]),
  reason: z.string().trim().min(10, "An email verification reason is required."),
})

export async function resetUserPasswordAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = ResetUserPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/users?status=password_invalid")
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, role: true },
  })
  if (!targetUser) redirect("/users?status=user_missing")

  const [updatedUser, revokedSessions] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash: await hashPassword(parsed.data.temporaryPassword) },
      select: { id: true },
    }),
    prisma.session.deleteMany({
      where: { userId: targetUser.id },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.password.reset",
        targetType: "User",
        targetId: targetUser.id,
        reason: parsed.data.reason,
        metadata: {
          emailHash: hashEmailForAudit(targetUser.email),
          role: targetUser.role,
          revokedExistingSessions: true,
          passwordStored: false,
        },
      },
    }),
  ])

  if (!updatedUser.id) redirect("/users?status=password_failed")
  if (revokedSessions.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.sessions.revoked_after_password_reset",
        targetType: "User",
        targetId: targetUser.id,
        reason: parsed.data.reason,
        metadata: {
          emailHash: hashEmailForAudit(targetUser.email),
          revokedSessionCount: revokedSessions.count,
        },
      },
    })
  }

  revalidatePath("/users")
  revalidatePath("/calibration/setup")
  redirect("/users?status=password_reset")
}

export async function updateEmailVerificationAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = UpdateEmailVerificationSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/users?status=email_invalid")
  }

  const verified = parsed.data.emailVerified === "true"
  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    select: { id: true, email: true, role: true, emailVerified: true },
  })
  if (!targetUser) redirect("/users?status=user_missing")

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { emailVerified: verified },
      select: { id: true },
    }),
    prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: verified ? "user.email.mark_verified" : "user.email.mark_unverified",
        targetType: "User",
        targetId: targetUser.id,
        reason: parsed.data.reason,
        metadata: {
          emailHash: hashEmailForAudit(targetUser.email),
          role: targetUser.role,
          previousEmailVerified: targetUser.emailVerified,
          emailVerified: verified,
        },
      },
    }),
  ])

  revalidatePath("/users")
  revalidatePath("/calibration/setup")
  redirect(`/users?status=${verified ? "email_verified" : "email_unverified"}`)
}
