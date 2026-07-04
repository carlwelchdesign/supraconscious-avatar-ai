"use server"

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { emitPilotEvent } from "@inner-avatar/ai"
import { getCurrentSession, hashPassword, requireAppUser, verifyPassword } from "@inner-avatar/auth/session"
import { archiveStripeCustomerForAccountDeletion } from "@inner-avatar/billing"
import { prisma } from "@inner-avatar/db"

export type VoiceActionState = { ok: boolean } | null

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(128),
    confirmPassword: z.string().min(8).max(128),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  })

const RevokeSessionSchema = z.object({
  sessionId: z.string().min(1),
})

const DeleteAccountSchema = z.object({
  password: z.string().min(1),
  confirmation: z.string().trim(),
})

export async function updateReflectionPreferences(
  formData: FormData,
): Promise<void> {
  const user = await requireAppUser()

  await prisma.user.update({
    where: { id: user.id },
    data: {
      patternMemoryEnabled: formData.get("patternMemoryEnabled") === "on",
      safetyModeEnabled: true,
    },
  })

  revalidatePath("/settings")
}

export async function changePasswordAction(formData: FormData) {
  const user = await requireAppUser()
  const parsed = ChangePasswordSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success) {
    redirect("/settings?password=invalid")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true },
  })

  if (!currentUser || !(await verifyPassword(parsed.data.currentPassword, currentUser.passwordHash))) {
    redirect("/settings?password=incorrect")
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(parsed.data.newPassword) },
      select: { id: true },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "user.password.changed",
        targetType: "User",
        targetId: user.id,
        reason: "User changed password from settings.",
        metadata: {
          passwordStored: false,
          existingSessionsRevoked: false,
        },
      },
    }),
  ])

  revalidatePath("/settings")
  redirect("/settings?password=changed")
}

export async function clearPatternMemoryAction() {
  const user = await requireAppUser()

  await prisma.$transaction([
    prisma.patternMemory.updateMany({
      where: { userId: user.id },
      data: { active: false },
    }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "pattern_memory.clear",
        targetType: "User",
        targetId: user.id,
        reason: "User cleared pattern memory.",
      },
    }),
  ])
  await emitPilotEvent({
    eventName: "pattern_memory_cleared",
    userId: user.id,
    properties: { clearedByUser: true },
  })

  revalidatePath("/settings")
  revalidatePath("/patterns")
}

export async function revokeSessionsAction() {
  const user = await requireAppUser()
  await prisma.$transaction([
    prisma.session.deleteMany({ where: { userId: user.id } }),
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "session.revoke_all",
        targetType: "User",
        targetId: user.id,
        reason: "User revoked all sessions.",
      },
    }),
  ])
  await emitPilotEvent({
    eventName: "session_revoked",
    userId: user.id,
    properties: { revokedAll: true },
  })

  redirect("/login")
}

export async function revokeSessionAction(formData: FormData) {
  const user = await requireAppUser()
  const parsed = RevokeSessionSchema.parse(Object.fromEntries(formData))
  const currentSession = await getCurrentSession("web")
  const isCurrentSession = currentSession?.id === parsed.sessionId

  const deleted = await prisma.session.deleteMany({
    where: {
      id: parsed.sessionId,
      userId: user.id,
    },
  })

  if (deleted.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "session.revoke_one",
        targetType: "Session",
        targetId: parsed.sessionId,
        reason: isCurrentSession ? "User revoked current session." : "User revoked one session.",
        metadata: {
          currentSession: isCurrentSession,
        },
      },
    })
    await emitPilotEvent({
      eventName: "session_revoked",
      userId: user.id,
      properties: { revokedAll: false, currentSession: isCurrentSession },
    })
  }

  if (isCurrentSession) {
    redirect("/login")
  }

  revalidatePath("/settings")
}

export async function deleteAccountAction(formData: FormData) {
  const user = await requireAppUser()
  const parsed = DeleteAccountSchema.safeParse(Object.fromEntries(formData))

  if (!parsed.success || parsed.data.confirmation !== "DELETE") {
    redirect("/settings?accountDelete=invalid")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, passwordHash: true, email: true },
  })

  if (!currentUser || !(await verifyPassword(parsed.data.password, currentUser.passwordHash))) {
    redirect("/settings?accountDelete=incorrect")
  }

  const subscriptions = await prisma.subscription.findMany({
    where: { userId: user.id },
    select: {
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  })
  const stripeCleanup = await archiveStripeCustomerForAccountDeletion({
    stripeCustomerId: subscriptions.find((subscription) => subscription.stripeCustomerId)?.stripeCustomerId,
    stripeSubscriptionIds: subscriptions.map((subscription) => subscription.stripeSubscriptionId),
  })

  await emitPilotEvent({
    eventName: "account_deletion_requested",
    userId: user.id,
    properties: { selfService: true },
  })

  await prisma.$transaction([
    prisma.auditLog.create({
      data: {
        actorId: user.id,
        action: "account.delete_self",
        targetType: "User",
        targetId: user.id,
        reason: "User deleted account from settings.",
        metadata: {
          email: currentUser.email,
          selfService: true,
          stripeCleanup,
        },
      },
    }),
    prisma.user.delete({
      where: { id: user.id },
    }),
  ])

  redirect("/")
}

export async function updateVoicePreferences(
  _prev: VoiceActionState,
  formData: FormData,
): Promise<VoiceActionState> {
  try {
    const user = await requireAppUser()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        voiceEnabled:      formData.get("voiceEnabled") === "on",
        voiceAutoPlay:     formData.get("voiceAutoPlay") === "on",
        voiceInputDefault: (formData.get("voiceInputDefault") as string) || "text",
        voiceGender:       (formData.get("voiceGender") as string) || "female",
        voiceStyle:        (formData.get("voiceStyle") as string) || "warm",
        voiceSpeed:        parseFloat((formData.get("voiceSpeed") as string) || "1"),
      },
    })

    revalidatePath("/settings")
    return { ok: true }
  } catch (err) {
    if (isRedirectError(err)) throw err
    return { ok: false }
  }
}
