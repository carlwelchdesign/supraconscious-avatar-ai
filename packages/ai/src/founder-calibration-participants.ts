import { prisma } from "@inner-avatar/db"

export const FOUNDER_CALIBRATION_PARTICIPANT_ROLES = ["carl", "maria", "reviewer", "other_founder"] as const
export const FOUNDER_CALIBRATION_PARTICIPANT_STATUSES = ["active", "paused"] as const

export type FounderCalibrationParticipantRole = (typeof FOUNDER_CALIBRATION_PARTICIPANT_ROLES)[number]
export type FounderCalibrationParticipantStatus = (typeof FOUNDER_CALIBRATION_PARTICIPANT_STATUSES)[number]
export type FounderCalibrationFilterMode = "db" | "env" | "fallback"

const DEFAULT_EXCLUDED_EMAILS = ["demo@inner-avatar.ai"]

export type FounderCalibrationUserWhere = {
  email: { in?: string[]; notIn?: string[] }
}

export type FounderCalibrationFilter = {
  where: FounderCalibrationUserWhere
  mode: FounderCalibrationFilterMode
  emails: string[]
  warnings: string[]
}

export type FounderCalibrationParticipantFilterInput = {
  activeParticipantEmails?: string[]
  envEmails?: string
}

export function normalizeFounderCalibrationEmail(email: string) {
  return email.trim().toLowerCase()
}

export function isFounderCalibrationParticipantRole(value: string): value is FounderCalibrationParticipantRole {
  return (FOUNDER_CALIBRATION_PARTICIPANT_ROLES as readonly string[]).includes(value)
}

export function isFounderCalibrationParticipantStatus(value: string): value is FounderCalibrationParticipantStatus {
  return (FOUNDER_CALIBRATION_PARTICIPANT_STATUSES as readonly string[]).includes(value)
}

export function resolveFounderCalibrationFilterFromInputs(input: FounderCalibrationParticipantFilterInput): FounderCalibrationFilter {
  const activeParticipantEmails = uniqueEmails(input.activeParticipantEmails ?? [])
  if (activeParticipantEmails.length > 0) {
    return {
      where: { email: { in: activeParticipantEmails } },
      mode: "db",
      emails: activeParticipantEmails,
      warnings: [],
    }
  }

  const envEmails = parseFounderCalibrationEmails(input.envEmails ?? process.env.FOUNDER_CALIBRATION_EMAILS)
  if (envEmails.length > 0) {
    return {
      where: { email: { in: envEmails } },
      mode: "env",
      emails: envEmails,
      warnings: ["Founder calibration is using FOUNDER_CALIBRATION_EMAILS because no active DB participants are configured."],
    }
  }

  return {
    where: { email: { notIn: DEFAULT_EXCLUDED_EMAILS } },
    mode: "fallback",
    emails: [],
    warnings: ["No active founder participants are configured; reports fall back to non-demo users."],
  }
}

export async function resolveFounderCalibrationUserFilter(
  prismaClient: Pick<typeof prisma, "founderCalibrationParticipant"> = prisma,
): Promise<FounderCalibrationFilter> {
  const participants = await readActiveFounderParticipantEmailsSafely(prismaClient)
  if (participants === null) {
    const fallback = resolveFounderCalibrationFilterFromInputs({ activeParticipantEmails: [] })
    return {
      ...fallback,
      warnings: ["Founder calibration participant table is not migrated yet.", ...fallback.warnings],
    }
  }

  return resolveFounderCalibrationFilterFromInputs({
    activeParticipantEmails: participants.map((participant) => participant.email),
  })
}

export async function isFounderCalibrationUser(
  email: string,
  prismaClient: Pick<typeof prisma, "founderCalibrationParticipant"> = prisma,
) {
  const normalizedEmail = normalizeFounderCalibrationEmail(email)
  const participantStatus = await readFounderParticipantStatusSafely(normalizedEmail, prismaClient)
  if (participantStatus === null) {
    const envEmails = parseFounderCalibrationEmails(process.env.FOUNDER_CALIBRATION_EMAILS)
    return envEmails.length > 0 ? envEmails.includes(normalizedEmail) : !DEFAULT_EXCLUDED_EMAILS.includes(normalizedEmail)
  }

  if (participantStatus.activeMatch) return true
  if (participantStatus.configuredParticipantCount > 0) return false

  const envEmails = parseFounderCalibrationEmails(process.env.FOUNDER_CALIBRATION_EMAILS)
  if (envEmails.length > 0) return envEmails.includes(normalizedEmail)

  return !DEFAULT_EXCLUDED_EMAILS.includes(normalizedEmail)
}

export function parseFounderCalibrationEmails(value: string | undefined) {
  return uniqueEmails((value ?? "").split(","))
}

function uniqueEmails(emails: string[]) {
  return Array.from(new Set(emails.map(normalizeFounderCalibrationEmail).filter(Boolean))).sort()
}

async function readActiveFounderParticipantEmailsSafely(
  prismaClient: Pick<typeof prisma, "founderCalibrationParticipant">,
): Promise<Array<{ email: string }> | null> {
  try {
    return await prismaClient.founderCalibrationParticipant.findMany({
      where: { status: "active" },
      select: { email: true },
      orderBy: { email: "asc" },
    })
  } catch (error) {
    if (isMissingFounderParticipantTable(error)) return null
    throw error
  }
}

async function readFounderParticipantStatusSafely(
  normalizedEmail: string,
  prismaClient: Pick<typeof prisma, "founderCalibrationParticipant">,
): Promise<{ activeMatch: boolean; configuredParticipantCount: number } | null> {
  try {
    const participant = await prismaClient.founderCalibrationParticipant.findFirst({
      where: { email: normalizedEmail, status: "active" },
      select: { id: true },
    })
    if (participant) return { activeMatch: true, configuredParticipantCount: 1 }

    const configuredParticipantCount = await prismaClient.founderCalibrationParticipant.count()
    return { activeMatch: false, configuredParticipantCount }
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
