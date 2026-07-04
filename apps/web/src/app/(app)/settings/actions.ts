"use server"

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { emitPilotEvent } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

export type VoiceActionState = { ok: boolean } | null
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
