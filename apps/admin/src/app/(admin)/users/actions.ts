"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { hashPassword, requireSuperAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const ResetUserPasswordSchema = z.object({
  userId: z.string().min(1),
  temporaryPassword: z.string().min(8, "Temporary password must be at least 8 characters.").max(128),
  reason: z.string().trim().min(10, "A password reset reason is required."),
})

export async function resetUserPasswordAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = ResetUserPasswordSchema.parse(Object.fromEntries(formData))
  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.userId },
    select: { id: true, email: true, role: true },
  })
  if (!targetUser) throw new Error("User not found.")

  const [updatedUser, revokedSessions] = await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { passwordHash: await hashPassword(parsed.temporaryPassword) },
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
        reason: parsed.reason,
        metadata: {
          email: targetUser.email,
          role: targetUser.role,
          revokedExistingSessions: true,
          passwordStored: false,
        },
      },
    }),
  ])

  if (!updatedUser.id) throw new Error("Password reset failed.")
  if (revokedSessions.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "user.sessions.revoked_after_password_reset",
        targetType: "User",
        targetId: targetUser.id,
        reason: parsed.reason,
        metadata: {
          email: targetUser.email,
          revokedSessionCount: revokedSessions.count,
        },
      },
    })
  }

  revalidatePath("/users")
  revalidatePath("/calibration/setup")
}
