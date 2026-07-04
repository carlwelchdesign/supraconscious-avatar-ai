import "server-only"

import { prisma } from "@inner-avatar/db"

export async function readPostLoginRedirect(user: { id: string; email: string; onboardingComplete: boolean }) {
  if (!user.onboardingComplete) return "/onboarding"

  const founderParticipant = await linkFounderParticipantIfConfigured(user.id, user.email)
  if (!founderParticipant) return "/dashboard"

  const councilSessionCount = await prisma.councilSession.count({
    where: { userId: user.id },
  })
  return councilSessionCount === 0 ? "/journal" : "/dashboard"
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
