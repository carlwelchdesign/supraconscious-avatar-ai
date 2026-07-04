import { prisma } from "@inner-avatar/db"
import {
  normalizeFounderCalibrationEmail,
  type FounderCalibrationParticipantRole,
} from "./founder-calibration-participants.js"

export type FounderCalibrationSetupInput = {
  carlEmail?: string
  mariaEmail?: string
  reviewerEmails?: string[]
  actorEmail?: string
  reason?: string
}

export type FounderCalibrationSetupResult = {
  created: string[]
  updated: string[]
  linked: string[]
  missingAccounts: string[]
  auditLogged: number
}

type ParticipantRequest = {
  email: string
  participantRole: FounderCalibrationParticipantRole
}

export async function setupFounderCalibrationParticipants(input: FounderCalibrationSetupInput): Promise<FounderCalibrationSetupResult> {
  const requests = buildParticipantRequests(input)
  const reason = input.reason ?? "Founder calibration first-session launch setup."
  const actor = input.actorEmail
    ? await prisma.user.findUnique({
      where: { email: normalizeFounderCalibrationEmail(input.actorEmail) },
      select: { id: true },
    })
    : null

  const result: FounderCalibrationSetupResult = {
    created: [],
    updated: [],
    linked: [],
    missingAccounts: [],
    auditLogged: 0,
  }

  for (const request of requests) {
    const user = await prisma.user.findUnique({
      where: { email: request.email },
      select: { id: true },
    })
    const existing = await prisma.founderCalibrationParticipant.findUnique({
      where: { email: request.email },
      select: { id: true },
    })
    const participant = await prisma.founderCalibrationParticipant.upsert({
      where: { email: request.email },
      create: {
        email: request.email,
        userId: user?.id ?? null,
        participantRole: request.participantRole,
        status: "active",
        addedById: actor?.id ?? null,
        reason,
      },
      update: {
        userId: user?.id ?? null,
        participantRole: request.participantRole,
        status: "active",
        reason,
      },
    })

    if (existing) result.updated.push(request.email)
    else result.created.push(request.email)
    if (user) result.linked.push(request.email)
    else result.missingAccounts.push(request.email)

    if (actor) {
      await prisma.auditLog.create({
        data: {
          actorId: actor.id,
          action: "founder_calibration_participant.setup",
          targetType: "FounderCalibrationParticipant",
          targetId: participant.id,
          reason,
          metadata: {
            email: request.email,
            participantRole: request.participantRole,
            linkedUser: Boolean(user),
            source: "setup_founder_calibration_command",
          },
        },
      })
      result.auditLogged += 1
    }
  }

  return result
}

export function buildFounderCalibrationSetupInputFromEnv(env: NodeJS.ProcessEnv = process.env): FounderCalibrationSetupInput {
  return {
    carlEmail: env.FOUNDER_CALIBRATION_CARL_EMAIL,
    mariaEmail: env.FOUNDER_CALIBRATION_MARIA_EMAIL,
    reviewerEmails: parseReviewerEmails(env.FOUNDER_CALIBRATION_REVIEWER_EMAILS),
    actorEmail: env.FOUNDER_CALIBRATION_SETUP_ACTOR_EMAIL,
  }
}

export function buildParticipantRequests(input: FounderCalibrationSetupInput): ParticipantRequest[] {
  const requests: ParticipantRequest[] = []
  if (input.carlEmail?.trim()) requests.push({ email: normalizeFounderCalibrationEmail(input.carlEmail), participantRole: "carl" })
  if (input.mariaEmail?.trim()) requests.push({ email: normalizeFounderCalibrationEmail(input.mariaEmail), participantRole: "maria" })
  for (const email of input.reviewerEmails ?? []) {
    if (email.trim()) requests.push({ email: normalizeFounderCalibrationEmail(email), participantRole: "reviewer" })
  }

  return dedupeRequests(requests)
}

function parseReviewerEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}

function dedupeRequests(requests: ParticipantRequest[]) {
  const deduped = new Map<string, ParticipantRequest>()
  for (const request of requests) {
    if (!deduped.has(request.email)) deduped.set(request.email, request)
  }
  return Array.from(deduped.values())
}
