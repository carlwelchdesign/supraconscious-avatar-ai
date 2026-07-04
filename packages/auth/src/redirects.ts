import "server-only"

import { prisma } from "@inner-avatar/db"
import { hasRequiredPilotConsents, REQUIRED_PILOT_CONSENTS } from "./consent"
import { choosePostLoginRedirect } from "./redirect-rules"

export { choosePostLoginRedirect } from "./redirect-rules"

export async function readPostLoginRedirect(user: { id: string; email: string; onboardingComplete: boolean }) {
  const founderParticipant = await linkFounderParticipantIfConfigured(user.id, user.email)
  const councilSessionCount = founderParticipant
    ? await prisma.councilSession.count({
      where: { userId: user.id },
    })
    : 0
  const consentRecords = await prisma.consentEvent.findMany({
    where: {
      userId: user.id,
      consentType: { in: [...REQUIRED_PILOT_CONSENTS] },
    },
    orderBy: { createdAt: "desc" },
    select: {
      consentType: true,
      consentVersion: true,
      granted: true,
      createdAt: true,
    },
  })

  return choosePostLoginRedirect({
    onboardingComplete: user.onboardingComplete,
    hasRequiredPilotConsents: hasRequiredPilotConsents(consentRecords),
    isFounderParticipant: Boolean(founderParticipant),
    councilSessionCount,
  })
}

export async function linkFounderParticipantIfConfigured(userId: string, email: string) {
  try {
    const participant = await prisma.founderCalibrationParticipant.findFirst({
      where: { email, status: "active" },
      select: { id: true, userId: true },
    })
    if (!participant) return null
    if (participant.userId === userId) return participant

    await prisma.founderCalibrationParticipant.update({
      where: { id: participant.id },
      data: { userId },
    })
    return participant
  } catch (error) {
    if (isMissingFounderParticipantTable(error)) return null
    throw error
  }
}

function isMissingFounderParticipantTable(error: unknown) {
  if (!error || typeof error !== "object") return false
  const record = error as { code?: unknown; message?: unknown }
  return record.code === "P2021" || (typeof record.message === "string" && record.message.includes("FounderCalibrationParticipant"))
}
