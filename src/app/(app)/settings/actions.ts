"use server"

import { isRedirectError } from "next/dist/client/components/redirect-error"
import { revalidatePath } from "next/cache"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

export type VoiceActionState = { ok: boolean } | null

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
