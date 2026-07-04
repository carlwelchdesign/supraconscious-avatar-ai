"use server"

import { redirect } from "next/navigation"
import { requireAppUser } from "@inner-avatar/auth/session"
import { OPTIONAL_PILOT_CONSENTS, PILOT_CONSENT_VERSION, REQUIRED_PILOT_CONSENTS } from "@inner-avatar/auth/consent"
import { emitPilotEvent } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

export async function acceptPilotOrientationAction(formData: FormData) {
  const user = await requireAppUser()
  const accepted = REQUIRED_PILOT_CONSENTS.every((type) => formData.get(type) === "on")
  const patternMemoryGranted = formData.get("pattern_memory") === "on"

  if (!accepted) {
    redirect("/onboarding?error=consent_required")
  }

  await prisma.$transaction([
    ...REQUIRED_PILOT_CONSENTS.map((consentType) =>
      prisma.consentEvent.create({
        data: {
          userId: user.id,
          consentType,
          consentVersion: PILOT_CONSENT_VERSION,
          granted: true,
          metadata: { source: "first_session_orientation" },
        },
      }),
    ),
    ...OPTIONAL_PILOT_CONSENTS.map((consentType) =>
      prisma.consentEvent.create({
        data: {
          userId: user.id,
          consentType,
          consentVersion: PILOT_CONSENT_VERSION,
          granted: patternMemoryGranted,
          metadata: { source: "first_session_orientation" },
        },
      }),
    ),
    prisma.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true, patternMemoryEnabled: patternMemoryGranted },
    }),
  ])

  await emitPilotEvent({
    eventName: "consent_accepted",
    userId: user.id,
    properties: {
      consentVersion: PILOT_CONSENT_VERSION,
      consentCount: REQUIRED_PILOT_CONSENTS.length + OPTIONAL_PILOT_CONSENTS.length,
      patternMemoryGranted,
    },
  })

  redirect("/journal")
}
