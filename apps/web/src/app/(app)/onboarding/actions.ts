"use server"

import { redirect } from "next/navigation"
import { requireAppUser } from "@inner-avatar/auth/session"
import { emitPilotEvent } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const REQUIRED_CONSENTS = [
  "privacy_terms",
  "ai_processing",
  "pattern_memory",
  "pilot_participation",
  "safety_limits",
] as const

export async function acceptPilotOrientationAction(formData: FormData) {
  const user = await requireAppUser()
  const accepted = REQUIRED_CONSENTS.every((type) => formData.get(type) === "on")

  if (!accepted) {
    redirect("/onboarding?error=consent_required")
  }

  await prisma.$transaction([
    ...REQUIRED_CONSENTS.map((consentType) =>
      prisma.consentEvent.create({
        data: {
          userId: user.id,
          consentType,
          consentVersion: "pilot-readiness-v1",
          granted: true,
          metadata: { source: "first_session_orientation" },
        },
      }),
    ),
    prisma.user.update({
      where: { id: user.id },
      data: { onboardingComplete: true, patternMemoryEnabled: formData.get("pattern_memory") === "on" },
    }),
  ])

  await emitPilotEvent({
    eventName: "consent_accepted",
    userId: user.id,
    properties: { consentVersion: "pilot-readiness-v1", consentCount: REQUIRED_CONSENTS.length },
  })

  redirect("/journal")
}
