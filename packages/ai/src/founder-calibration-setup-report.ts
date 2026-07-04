import { prisma } from "@inner-avatar/db"
import { hasRequiredPilotConsents, type PilotConsentRecord } from "@inner-avatar/types/pilot-consent"
import {
  FOUNDER_CALIBRATION_SCENARIOS,
  readFounderCalibrationScenario,
  type FounderCalibrationScenario,
} from "./founder-calibration-scenarios.js"
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
  consentPresent: boolean
  sessionCount: number
  lastSessionAt: string | null
  feedbackNoteCount: number
  reviewedSessionCount: number
  goldenExampleCount: number
  nextAction: string
  nextActionHref: string | null
  scenarioStatus: FounderCalibrationParticipantScenarioStatus[]
  missingActions: FounderCalibrationMissingAction[]
}

export type FounderCalibrationParticipantScenarioStatus = {
  scenario: FounderCalibrationScenario
  completed: boolean
  sessionCount: number
  hasReadyExample: boolean
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

export type FounderCalibrationRequiredRole = "carl" | "maria"

export type FounderCalibrationRequiredRoleReadiness = {
  role: FounderCalibrationRequiredRole
  participantId: string | null
  email: string | null
  configured: boolean
  active: boolean
  accountExists: boolean
  onboardingComplete: boolean
  consentPresent: boolean
  sessionPresent: boolean
  feedbackNotePresent: boolean
  goldenExamplePresent: boolean
  nextAction: string
  nextActionHref: string | null
  primaryHandoffHref: string | null
  handoffText: string
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
  requiredRoles: Record<FounderCalibrationRequiredRole, FounderCalibrationRequiredRoleReadiness>
  missingRequiredRoles: FounderCalibrationRequiredRole[]
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
    consentRecords?: PilotConsentRecord[]
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
      consentRecords: participant.user?.consentEvents ?? [],
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
            consentEvents: {
              orderBy: { createdAt: "desc" },
              select: { consentType: true, consentVersion: true, granted: true, createdAt: true },
            },
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
    const consentPresent = participant.consentRecords
      ? hasRequiredPilotConsents(participant.consentRecords)
      : participant.consentCount > 0
    const feedbackNoteCount = sessions.reduce((count, session) => count + session.feedback.filter((feedback) => feedback.hasNote).length, 0)
    const reviewedSessionCount = sessions.filter((session) => session.qualityReviews.length > 0).length
    const goldenExampleCount = sessions.filter((session) => session.qualityReviews.some((review) => READY_LABELS.has(review.label))).length

    for (const session of sessions) {
      const scenario = readSessionScenario(session)
      scenarioCounts.set(scenario, (scenarioCounts.get(scenario) ?? 0) + 1)
    }
    const scenarioStatus = buildScenarioStatus(sessions)

    const missingActions = buildParticipantMissingActions({
      email: participant.email,
      status: participant.status,
      accountExists: Boolean(participant.userId),
      onboardingComplete: participant.onboardingComplete,
      consentCount: participant.consentCount,
      consentPresent,
      sessionCount: sessions.length,
      feedbackNoteCount,
      goldenExampleCount,
    })
    const nextAction = chooseParticipantNextAction(missingActions, scenarioStatus)

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
      consentPresent,
      sessionCount: sessions.length,
      lastSessionAt: sessions[0]?.createdAt.toISOString() ?? null,
      feedbackNoteCount,
      reviewedSessionCount,
      goldenExampleCount,
      nextAction: nextAction.message,
      nextActionHref: nextAction.href,
      scenarioStatus,
      missingActions,
    }
  })

  const activeParticipants = participants.filter((participant) => participant.status === "active")
  const requiredRoles = buildRequiredRoleReadiness(participants)
  const missingRequiredRoles = (["carl", "maria"] as const).filter((role) => !requiredRoles[role].active)
  const missingActions = [
    ...buildRequiredRoleMissingActions(requiredRoles),
    ...participants.flatMap((participant) => participant.missingActions),
  ]

  const readiness = {
    configuredParticipants: participants.length,
    activeParticipants: activeParticipants.length,
    linkedUsers: activeParticipants.filter((participant) => participant.accountExists).length,
    onboardingComplete: activeParticipants.filter((participant) => participant.onboardingComplete).length,
    participantsWithConsent: activeParticipants.filter((participant) => participant.consentPresent).length,
    participantsWithSessions: activeParticipants.filter((participant) => participant.sessionCount > 0).length,
    participantsWithFeedbackNotes: activeParticipants.filter((participant) => participant.feedbackNoteCount > 0).length,
    participantsWithGoldenExamples: activeParticipants.filter((participant) => participant.goldenExampleCount > 0).length,
    ready: missingRequiredRoles.length === 0 && missingActions.length === 0,
  }

  const warnings = [...snapshot.filterWarnings]
  if (snapshot.filterMode !== "db") warnings.push("Founder calibration participant setup is incomplete; DB participants should be configured before relying on reports.")

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    filterMode: snapshot.filterMode,
    participants,
    readiness,
    requiredRoles,
    missingRequiredRoles,
    missingActions,
    scenarioCoverage: Array.from(scenarioCounts.entries())
      .map(([scenario, totalSessions]) => ({ scenario, totalSessions }))
      .sort((a, b) => b.totalSessions - a.totalSessions || a.scenario.localeCompare(b.scenario)),
    blockers: missingActions.map((action) => action.message),
    warnings,
  }
}

function buildRequiredRoleReadiness(participants: FounderCalibrationSetupParticipant[]) {
  return {
    carl: buildRequiredRoleStatus("carl", participants),
    maria: buildRequiredRoleStatus("maria", participants),
  } satisfies Record<FounderCalibrationRequiredRole, FounderCalibrationRequiredRoleReadiness>
}

function buildRequiredRoleStatus(role: FounderCalibrationRequiredRole, participants: FounderCalibrationSetupParticipant[]): FounderCalibrationRequiredRoleReadiness {
  const roleParticipants = participants.filter((participant) => participant.participantRole === role)
  const activeParticipant = roleParticipants.find((participant) => participant.status === "active")
  const participant = activeParticipant ?? roleParticipants[0] ?? null
  if (!participant) {
    const nextAction = `Add ${role} as a founder calibration participant.`
    return {
      role,
      participantId: null,
      email: null,
      configured: false,
      active: false,
      accountExists: false,
      onboardingComplete: false,
      consentPresent: false,
      sessionPresent: false,
      feedbackNotePresent: false,
      goldenExamplePresent: false,
      nextAction,
      nextActionHref: "/calibration/setup",
      primaryHandoffHref: null,
      handoffText: `Founder calibration setup is not ready yet. Ask the admin to add the ${role} participant before sending first-session instructions.`,
    }
  }
  if (participant.status !== "active") {
    const nextAction = `Activate ${participant.email} for ${role} calibration.`
    return {
      role,
      participantId: participant.id,
      email: participant.email,
      configured: true,
      active: false,
      accountExists: participant.accountExists,
      onboardingComplete: participant.onboardingComplete,
      consentPresent: participant.consentPresent,
      sessionPresent: participant.sessionCount > 0,
      feedbackNotePresent: participant.feedbackNoteCount > 0,
      goldenExamplePresent: participant.goldenExampleCount > 0,
      nextAction,
      nextActionHref: "/calibration/setup",
      primaryHandoffHref: null,
      handoffText: `Founder calibration setup is paused for ${participant.email}. Ask the admin to activate this participant before sending first-session instructions.`,
    }
  }
  const primaryHandoffHref = readFounderHandoffHref(participant)
  return {
    role,
    participantId: participant.id,
    email: participant.email,
    configured: true,
    active: true,
    accountExists: participant.accountExists,
    onboardingComplete: participant.onboardingComplete,
    consentPresent: participant.consentPresent,
    sessionPresent: participant.sessionCount > 0,
    feedbackNotePresent: participant.feedbackNoteCount > 0,
    goldenExamplePresent: participant.goldenExampleCount > 0,
    nextAction: participant.nextAction,
    nextActionHref: participant.nextActionHref,
    primaryHandoffHref,
    handoffText: buildFounderHandoffText(participant, primaryHandoffHref),
  }
}

function buildRequiredRoleMissingActions(requiredRoles: Record<FounderCalibrationRequiredRole, FounderCalibrationRequiredRoleReadiness>) {
  const actions: FounderCalibrationMissingAction[] = []
  for (const role of ["carl", "maria"] as const) {
    const readiness = requiredRoles[role]
    if (!readiness.configured) {
      actions.push({
        code: `${role}_participant_missing`,
        message: `Add ${role} as a founder calibration participant.`,
        href: "/calibration/setup",
      })
    } else if (!readiness.active) {
      actions.push({
        code: `${role}_participant_paused`,
        email: readiness.email ?? undefined,
        message: `Activate ${readiness.email ?? role} for ${role} calibration.`,
        href: "/calibration/setup",
      })
    }
  }
  return actions
}

function buildScenarioStatus(sessions: FounderCalibrationSetupSnapshot["participants"][number]["sessions"]) {
  return FOUNDER_CALIBRATION_SCENARIOS.filter((scenario) => scenario !== "freeform").map((scenario) => {
    const matchingSessions = sessions.filter((session) => readSessionScenario(session) === scenario)
    return {
      scenario,
      completed: matchingSessions.length > 0,
      sessionCount: matchingSessions.length,
      hasReadyExample: matchingSessions.some((session) => session.qualityReviews.some((review) => READY_LABELS.has(review.label))),
    }
  })
}

function chooseParticipantNextAction(
  missingActions: FounderCalibrationMissingAction[],
  scenarioStatus: FounderCalibrationParticipantScenarioStatus[],
) {
  const primaryMissingAction = missingActions[0]
  if (primaryMissingAction) return { message: primaryMissingAction.message, href: readFounderLaunchHref(primaryMissingAction.code) }
  const nextScenario = scenarioStatus.find((item) => !item.completed)
  if (nextScenario) return { message: `Run the ${nextScenario.scenario} guided scenario.`, href: "/journal" }
  const scenarioWithoutReadyExample = scenarioStatus.find((item) => item.completed && !item.hasReadyExample)
  if (scenarioWithoutReadyExample) return { message: `Review ${scenarioWithoutReadyExample.scenario} and mark ready or assign an issue.`, href: "/calibration/live" }
  return { message: "Founder calibration launch loop is ready; continue with the next real session.", href: "/calibration/live" }
}

function readFounderLaunchHref(code: string) {
  if (code === "account_missing") return "/register"
  if (code === "onboarding_incomplete" || code === "consent_missing") return "/onboarding"
  if (code === "session_missing" || code === "feedback_note_missing") return "/journal"
  if (code === "golden_example_missing") return "/calibration/live"
  return null
}

function readFounderHandoffHref(participant: FounderCalibrationSetupParticipant) {
  if (!participant.accountExists) return "/register"
  if (!participant.onboardingComplete || !participant.consentPresent) return "/onboarding"
  if (participant.sessionCount === 0 || participant.feedbackNoteCount === 0) return "/journal"
  if (participant.goldenExampleCount === 0) return "/calibration/live"
  return "/journal"
}

function buildFounderHandoffText(participant: FounderCalibrationSetupParticipant, primaryHandoffHref: string | null) {
  const firstIncompleteScenario = participant.scenarioStatus.find((item) => !item.completed)
  const suggestedScenario = firstIncompleteScenario?.scenario ?? "voice_test"
  const primaryPath = primaryHandoffHref ?? "/journal"
  if (!participant.accountExists) {
    return `Please register for Inner Avatar using ${participant.email}, then complete onboarding. After onboarding, open /journal and use the preselected ${suggestedScenario} guided calibration prompt. Submit one reflection, select a feedback type, and leave a short note about what felt right or wrong. Start here: ${primaryPath}`
  }
  if (!participant.onboardingComplete || !participant.consentPresent) {
    return `Please log in as ${participant.email} and complete onboarding/consent. Then open /journal and use the preselected ${suggestedScenario} guided calibration prompt. Submit one reflection, select a feedback type, and leave a short note. Continue here: ${primaryPath}`
  }
  if (participant.sessionCount === 0) {
    return `Please open /journal and use the preselected ${suggestedScenario} guided calibration prompt. Submit one reflection, select a feedback type, and leave a short note about voice, source grounding, intensity, embodiment, or what Maria would phrase differently. Start here: ${primaryPath}`
  }
  if (participant.feedbackNoteCount === 0) {
    return `Please open the latest calibration session and add feedback with a short note. The note is required for Carl/Maria calibration and does not automatically retrain the guide. Continue here: ${primaryPath}`
  }
  if (participant.goldenExampleCount === 0) {
    return `Your first calibration evidence is captured. The admin review step is next: mark the session ready/golden or assign a voice, source, prompt, intensity, or embodiment issue. Review here: ${primaryPath}`
  }
  return `Founder calibration is ready for another guided session. Open /journal, use the next useful guided scenario, and leave a feedback note after the reflection. Continue here: ${primaryPath}`
}

function buildParticipantMissingActions(input: {
  email: string
  status: string
  accountExists: boolean
  onboardingComplete: boolean
  consentCount: number
  consentPresent: boolean
  sessionCount: number
  feedbackNoteCount: number
  goldenExampleCount: number
}) {
  if (input.status !== "active") return []
  const actions: FounderCalibrationMissingAction[] = []
  if (!input.accountExists) actions.push({ code: "account_missing", email: input.email, message: `${input.email} needs to register.`, href: "/users" })
  if (input.accountExists && !input.onboardingComplete) actions.push({ code: "onboarding_incomplete", email: input.email, message: `${input.email} needs to complete onboarding.`, href: "/users" })
  if (input.accountExists && !input.consentPresent) actions.push({ code: "consent_missing", email: input.email, message: `${input.email} needs current required pilot consent records.`, href: "/users" })
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
