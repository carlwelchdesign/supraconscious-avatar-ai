import { z } from "zod"
import { isRedirectError } from "next/dist/client/components/redirect-error"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { privateJson } from "@/lib/private-json"
import { PUBLIC_USER_PREFERENCES_SELECT } from "@/lib/public-user-preferences"

const VoicePrefsSchema = z.object({
  voiceEnabled: z.boolean().optional(),
  voiceAutoPlay: z.boolean().optional(),
  voiceInputDefault: z.enum(["text", "voice", "ask"]).optional(),
  voiceGender: z.enum(["female", "male"]).optional(),
  voiceStyle: z.enum(["warm", "neutral", "deep", "soft"]).optional(),
  voiceSpeed: z.number().min(0.25).max(4.0).optional(),
})

export async function PATCH(request: Request) {
  try {
    const user = await requireAppUser()
    const body = VoicePrefsSchema.parse(await request.json())
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: body,
      select: PUBLIC_USER_PREFERENCES_SELECT,
    })
    return privateJson({ user: updated })
  } catch (error) {
    if (isRedirectError(error)) throw error
    const message = error instanceof Error ? error.message : "Unable to update voice preferences."
    return privateJson({ error: message }, { status: 400 })
  }
}
