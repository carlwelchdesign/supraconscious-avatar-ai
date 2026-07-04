import { prisma } from "@inner-avatar/db"
import { readFounderCalibrationScenario, type FounderCalibrationScenario } from "./founder-calibration-scenarios.js"
import {
  resolveFounderCalibrationUserFilter,
  type FounderCalibrationFilterMode,
  type FounderCalibrationParticipantRole,
  type FounderCalibrationParticipantStatus,
} from "./founder-calibration-participants.js"

export type FounderCalibrationMissingAction = {
  code: string
  message: string
  email?: string
  href?: string
}

export type FounderCalibrationSetupParticipant = {
  id: string
  email: string
  participantRole: FounderCalibrationParticipantRole
  status: FounderCalibrationParticipantStatus
  userId: string | null
  userName: string | null
  accountExists: boolean
  onboardingComplete: boolean
  consentCount: number
  sessionCount: number
  lastSessionAt: string | null
  feedbackNoteCount: number
  reviewedSessionCount: number
  goldenExampleCount: number
  missingActions: FounderCalibrationMissingAction[]
}

export type FounderCalibrationSetupReadiness = {
  configuredParticipants: number
  activeParticipants: number
  linkedUsers: number
  onboardingComplete: number
  participantsWithConsent: number
  participantsWithSessions: number
  participantsWithFeedbackNotes: number
  participantsWithGoldenExamples: number
  ready: boolean
}

export type FounderCalibrationSetupScenarioCoverage = {
  scenario: FounderCalibrationScenario
  totalSessions: number
}

export type FounderCalibrationSetupReport = {
  checkedAt: string
  filterMode: FounderCalibrationFilterMode
  participants: FounderCalibrationSetupParticipant[]
  readiness: FounderCalibrationSetupReadiness
  missingActions: FounderCalibrationMissingAction[]
  scenarioCoverage: FounderCalibrationSetupScenarioCoverage[]
  blockers: string[]
  warnings: string[]
}

export type FounderCalibrationSetupSnapshot = {
  checkedAt: Date
  filterMode: FounderCalibrationFilterMode
  filterWarnings: string[]
  participants: Array<{
    id: string
    email: string
    participantRole: string
    status: string
    userId: string | null
    userName: string | null
    onboardingComplete: boolean
    consentCount: number
    sessions: Array<{
      id: string
      createdAt: Date
      feedback: Array<{ hasNote: boolean }>
      qualityReviews: Array<{ label: string; severity: string }>
      generationTraces: Array<{ traceType: string; outputJson: unknown }>
    }>
  }>
}

const READY_LABELS = new Set(["ready", "voice_good", "source_good", "grounded"])

export async function runFounderCalibrationSetupReport(now = new Date()): Promise<FounderCalibrationSetupReport> {
  const filter = await resolveFounderCalibrationUserFilter()
  const participants = await readSetupParticipantsSafely()
  if (participants === null) {
    return buildFounderCalibrationSetupReportFromSnapshot({
      checkedAt: now,
      filterMode: filter.mode,
      filterWarnings: ["Founder calibration participant table is not migrated yet.", ...filter.warnings],
      participants: [],
    })
  }

  return buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: now,
    filterMode: filter.mode,
    filterWarnings: filter.warnings,
    participants: participants.map((participant) => ({
      id: participant.id,
      email: participant.email,
      participantRole: participant.participantRole,
      status: participant.status,
      userId: participant.user?.id ?? participant.userId,
      userName: participant.user?.name ?? null,
      onboardingComplete: participant.user?.onboardingComplete ?? false,
      consentCount: participant.user?.consentEvents.length ?? 0,
      sessions: (participant.user?.councilSessions ?? []).map((session) => ({
        id: session.id,
        createdAt: session.createdAt,
        feedback: session.feedback.map((feedback) => ({ hasNote: Boolean(feedback.note?.trim()) })),
        qualityReviews: session.qualityReviews,
        generationTraces: session.generationTraces,
      })),
    })),
  })
}

async function readSetupParticipantsSafely() {
  try {
    return await prisma.founderCalibrationParticipant.findMany({
      orderBy: [{ status: "asc" }, { email: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            name: true,
            onboardingComplete: true,
            consentEvents: { select: { id: true } },
            councilSessions: {
              orderBy: { createdAt: "desc" },
              take: 50,
              select: {
                id: true,
                createdAt: true,
                feedback: { select: { note: true } },
                qualityReviews: {
                  orderBy: { reviewedAt: "desc" },
                  take: 5,
                  select: { label: true, severity: true },
                },
                generationTraces: {
                  where: { traceType: "council" },
                  orderBy: { createdAt: "desc" },
                  take: 1,
                  select: { traceType: true, outputJson: true },
                },
              },
            },
          },
        },
      },
    })
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

export function buildFounderCalibrationSetupReportFromSnapshot(snapshot: FounderCalibrationSetupSnapshot): FounderCalibrationSetupReport {
  const scenarioCounts = new Map<FounderCalibrationScenario, number>()
  const participants = snapshot.participants.map((participant) => {
    const sessions = participant.status === "active" ? participant.sessions : []
    const feedbackNoteCount = sessions.reduce((count, session) => count + session.feedback.filter((feedback) => feedback.hasNote).length, 0)
    const reviewedSessionCount = sessions.filter((session) => session.qualityReviews.length > 0).length
    const goldenExampleCount = sessions.filter((session) => session.qualityReviews.some((review) => READY_LABELS.has(review.label))).length

    for (const session of sessions) {
      const scenario = readSessionScenario(session)
      scenarioCounts.set(scenario, (scenarioCounts.get(scenario) ?? 0) + 1)
    }

    const missingActions = buildParticipantMissingActions({
      email: participant.email,
      status: participant.status,
      accountExists: Boolean(participant.userId),
      onboardingComplete: participant.onboardingComplete,
      consentCount: participant.consentCount,
      sessionCount: sessions.length,
      feedbackNoteCount,
      goldenExampleCount,
    })

    return {
      id: participant.id,
      email: participant.email,
      participantRole: readParticipantRole(participant.participantRole),
      status: readParticipantStatus(participant.status),
      userId: participant.userId,
      userName: participant.userName,
      accountExists: Boolean(participant.userId),
      onboardingComplete: participant.onboardingComplete,
      consentCount: participant.consentCount,
      sessionCount: sessions.length,
      lastSessionAt: sessions[0]?.createdAt.toISOString() ?? null,
      feedbackNoteCount,
      reviewedSessionCount,
      goldenExampleCount,
      missingActions,
    }
  })

  const activeParticipants = participants.filter((participant) => participant.status === "active")
  const missingActions = participants.flatMap((participant) => participant.missingActions)
  if (participants.length === 0) {
    missingActions.push({
      code: "no_founder_participants",
      message: "Add Carl and Maria as founder calibration participants.",
      href: "/calibration/setup",
    })
  }

  const readiness = {
    configuredParticipants: participants.length,
    activeParticipants: activeParticipants.length,
    linkedUsers: activeParticipants.filter((participant) => participant.accountExists).length,
    onboardingComplete: activeParticipants.filter((participant) => participant.onboardingComplete).length,
    participantsWithConsent: activeParticipants.filter((participant) => participant.consentCount > 0).length,
    participantsWithSessions: activeParticipants.filter((participant) => participant.sessionCount > 0).length,
    participantsWithFeedbackNotes: activeParticipants.filter((participant) => participant.feedbackNoteCount > 0).length,
    participantsWithGoldenExamples: activeParticipants.filter((participant) => participant.goldenExampleCount > 0).length,
    ready: participants.length > 0 && missingActions.length === 0,
  }

  const warnings = [...snapshot.filterWarnings]
  if (snapshot.filterMode !== "db") warnings.push("Founder calibration participant setup is incomplete; DB participants should be configured before relying on reports.")

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    filterMode: snapshot.filterMode,
    participants,
    readiness,
    missingActions,
    scenarioCoverage: Array.from(scenarioCounts.entries())
      .map(([scenario, totalSessions]) => ({ scenario, totalSessions }))
      .sort((a, b) => b.totalSessions - a.totalSessions || a.scenario.localeCompare(b.scenario)),
    blockers: missingActions.map((action) => action.message),
    warnings,
  }
}

function buildParticipantMissingActions(input: {
  email: string
  status: string
  accountExists: boolean
  onboardingComplete: boolean
  consentCount: number
  sessionCount: number
  feedbackNoteCount: number
  goldenExampleCount: number
}) {
  if (input.status !== "active") return []
  const actions: FounderCalibrationMissingAction[] = []
  if (!input.accountExists) actions.push({ code: "account_missing", email: input.email, message: `${input.email} needs to register.`, href: "/users" })
  if (input.accountExists && !input.onboardingComplete) actions.push({ code: "onboarding_incomplete", email: input.email, message: `${input.email} needs to complete onboarding.`, href: "/users" })
  if (input.accountExists && input.consentCount === 0) actions.push({ code: "consent_missing", email: input.email, message: `${input.email} needs pilot consent records.`, href: "/users" })
  if (input.accountExists && input.sessionCount === 0) actions.push({ code: "session_missing", email: input.email, message: `${input.email} needs one guided calibration session.`, href: "/calibration/live" })
  if (input.sessionCount > 0 && input.feedbackNoteCount === 0) actions.push({ code: "feedback_note_missing", email: input.email, message: `${input.email} needs at least one calibration feedback note.`, href: "/calibration/live" })
  if (input.sessionCount > 0 && input.goldenExampleCount === 0) actions.push({ code: "golden_example_missing", email: input.email, message: `${input.email} needs at least one ready/golden example review.`, href: "/calibration/live" })
  return actions
}

function readSessionScenario(session: FounderCalibrationSetupSnapshot["participants"][number]["sessions"][number]) {
  const output = session.generationTraces.find((trace) => trace.traceType === "council")?.outputJson
  if (!output || typeof output !== "object" || !("calibration" in output)) return "freeform"
  const calibration = (output as { calibration?: unknown }).calibration
  if (!calibration || typeof calibration !== "object" || !("scenario" in calibration)) return "freeform"
  return readFounderCalibrationScenario((calibration as { scenario?: unknown }).scenario)
}

function readParticipantRole(value: string): FounderCalibrationParticipantRole {
  if (value === "carl" || value === "maria" || value === "reviewer") return value
  return "other_founder"
}

function readParticipantStatus(value: string): FounderCalibrationParticipantStatus {
  return value === "paused" ? "paused" : "active"
}
