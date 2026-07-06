import { z } from "zod"
import { emitPilotEvent } from "@inner-avatar/ai"
import { PILOT_CONSENT_VERSION } from "@inner-avatar/auth/consent"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { privateJson } from "@/lib/private-json"
import { PUBLIC_USER_PREFERENCES_SELECT } from "@/lib/public-user-preferences"

const PreferencesSchema = z.object({
  avatarTone: z.enum(["gentle", "balanced", "direct"]).optional(),
  intensityLevel: z.number().int().min(1).max(5).optional(),
  patternMemoryEnabled: z.boolean().optional(),
  topicsToAvoid: z.array(z.string()).optional(),
})

export async function PATCH(request: Request) {
  try {
    const user = await requireAppUser()
    const body = PreferencesSchema.parse(await request.json())
    const patternMemoryChanged = typeof body.patternMemoryEnabled === "boolean"

    const updated = await prisma.$transaction(async (tx) => {
      const savedUser = await tx.user.update({
        where: { id: user.id },
        data: body,
        select: PUBLIC_USER_PREFERENCES_SELECT,
      })

      if (patternMemoryChanged) {
        await tx.consentEvent.create({
          data: {
            userId: user.id,
            consentType: "pattern_memory",
            consentVersion: PILOT_CONSENT_VERSION,
            granted: body.patternMemoryEnabled === true,
            metadata: { source: "api_avatar_preferences" },
          },
        })
      }

      return savedUser
    })

    if (patternMemoryChanged) {
      await emitPilotEvent({
        eventName: "consent_accepted",
        userId: user.id,
        properties: {
          consentType: "pattern_memory",
          consentVersion: PILOT_CONSENT_VERSION,
          granted: body.patternMemoryEnabled === true,
          source: "api_avatar_preferences",
        },
      })
    }

    return privateJson({ user: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update preferences."
    return privateJson({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}
