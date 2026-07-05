import { prisma } from "@inner-avatar/db"
import { hasRequiredPilotConsents, type PilotConsentRecord } from "@inner-avatar/types/pilot-consent"
import {
  formatFounderCalibrationScenario,
  FOUNDER_CALIBRATION_SCENARIOS,
  readFounderCalibrationScenario,
  type FounderCalibrationScenario,
} from "./founder-calibration-scenarios.js"
import {
  parseFounderCalibrationEmails,
  resolveFounderCalibrationUserFilter,
  type FounderCalibrationFilterMode,
  type FounderCalibrationParticipantRole,
  type FounderCalibrationParticipantStatus,
} from "./founder-calibration-participants.js"
import { isFounderCalibrationFeedbackNoteUseful } from "./founder-feedback-notes.js"

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
  feedbackEvidenceCount: number
  lastSessionAt: string | null
  feedbackNoteCount: number
  reviewedSessionCount: number
  goldenExampleCount: number
  latestSessionHref: string | null
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
  participantsWithFeedbackEvidence: number
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

export type FounderCalibrationJournalReadiness = {
  founderCalibrationMode: boolean
  suggestedCalibrationScenario: Exclude<FounderCalibrationScenario, "freeform"> | null
  needsFounderFirstSessionGuide: boolean
  needsFounderFeedbackNote: boolean
  founderFeedbackNoteHref: string | null
  sessionCount: number
  feedbackEvidenceCount: number
  feedbackNoteCount: number
  reviewedSessionCount: number
  goldenExampleCount: number
}

export type FounderCalibrationHandoffItem = {
  role: FounderCalibrationRequiredRole
  email: string | null
  nextAction: string
  primaryHref: string | null
  handoffText: string
  readyForFirstSession: boolean
}

export type FounderCalibrationHandoffReport = {
  checkedAt: string
  items: FounderCalibrationHandoffItem[]
  blockers: string[]
  warnings: string[]
}

export type FounderCalibrationLaunchPacketOptions = {
  webAppBaseUrl?: string
  adminAppBaseUrl?: string
  includeLocalCommands?: boolean
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
      journalEntryId: string
      createdAt: Date
      feedback: Array<{ hasFeedback?: boolean; hasNote: boolean }>
      qualityReviews: Array<{ label: string; severity: string }>
      generationTraces: Array<{ traceType: string; outputJson: unknown }>
    }>
  }>
}

const READY_LABELS = new Set(["ready", "voice_good", "source_good", "grounded"])

export async function runFounderCalibrationHandoffReport(options: {
  webAppBaseUrl?: string
  adminAppBaseUrl?: string
  now?: Date
} = {}): Promise<FounderCalibrationHandoffReport> {
  return buildFounderCalibrationHandoffReport(
    await runFounderCalibrationSetupReport(options.now),
    options,
  )
}

export function buildFounderCalibrationHandoffReport(
  setupReport: FounderCalibrationSetupReport,
  options: { webAppBaseUrl?: string; adminAppBaseUrl?: string } = {},
): FounderCalibrationHandoffReport {
  const webAppBaseUrl = normalizeBaseUrl(options.webAppBaseUrl ?? process.env.INNER_AVATAR_WEB_URL ?? "http://localhost:3000")
  const adminAppBaseUrl = normalizeBaseUrl(options.adminAppBaseUrl ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001")
  const items = (["carl", "maria"] as const).map((role) => {
    const readiness = setupReport.requiredRoles[role]
    const primaryHref = resolveFounderHandoffHref(readiness.primaryHandoffHref, readiness.email, webAppBaseUrl, adminAppBaseUrl)
    return {
      role,
      email: readiness.email,
      nextAction: readiness.nextAction,
      primaryHref,
      handoffText: resolveFounderHandoffText(readiness.handoffText, readiness.email, webAppBaseUrl, adminAppBaseUrl),
      readyForFirstSession: Boolean(readiness.active && readiness.accountExists && readiness.onboardingComplete && readiness.consentPresent),
    }
  })

  return {
    checkedAt: setupReport.checkedAt,
    items,
    blockers: setupReport.blockers,
    warnings: setupReport.warnings,
  }
}

export function buildFounderCalibrationLaunchPacket(
  report: FounderCalibrationHandoffReport,
  options: FounderCalibrationLaunchPacketOptions = {},
) {
  const adminAppBaseUrl = normalizeBaseUrl(options.adminAppBaseUrl ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? "http://localhost:3001")
  const lines = [
    "# Founder Calibration Launch Packet",
    "",
    `Checked at: ${report.checkedAt}`,
    "",
  ]

  if (options.includeLocalCommands ?? true) {
    lines.push(
      "## Start Local Apps",
      "Run: yarn dev:founder-calibration",
      "Smoke check: yarn smoke:founder-local --web-url http://localhost:3000 --admin-url http://localhost:3001 --passes 3",
      `Admin setup: ${adminAppBaseUrl}/calibration/setup`,
      `Admin live review: ${adminAppBaseUrl}/calibration/live`,
      "",
    )
  } else {
    lines.push(
      "## Admin Links",
      `Admin setup: ${adminAppBaseUrl}/calibration/setup`,
      `Admin live review: ${adminAppBaseUrl}/calibration/live`,
      "",
    )
  }

  lines.push("## Founder Handoff")
  for (const item of report.items) {
    lines.push(
      `### ${item.role.toUpperCase()}`,
      `Email: ${item.email ?? "not configured"}`,
      `Next action: ${item.nextAction}`,
    )
    if (item.primaryHref) lines.push(`Primary link: ${item.primaryHref}`)
    lines.push("", item.handoffText, "")
  }

  if (report.blockers.length > 0) {
    lines.push("## Current Blockers")
    for (const blocker of report.blockers) lines.push(`- ${blocker}`)
    lines.push("")
  }

  if (report.warnings.length > 0) {
    lines.push("## Warnings")
    for (const warning of report.warnings) lines.push(`- ${warning}`)
    lines.push("")
  }

  lines.push(
    "## After First Sessions",
    "- Continue with the next useful guided journal pass.",
    "- Choose one feedback type for each founder calibration session so review has usable evidence.",
    "- Add written notes when a specific voice, source, intensity, embodiment, or phrasing detail matters.",
    "- Mark strong sessions ready/golden when one clearly stands out; golden examples are useful, not blockers for continued development.",
    "- Run: yarn report:founder-calibration",
    "- Run: yarn report:founder-calibration-comparison",
  )

  return lines.join("\n")
}

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
        journalEntryId: session.journalEntryId,
        createdAt: session.createdAt,
        feedback: session.feedback.map((feedback) => ({ hasFeedback: true, hasNote: isFounderCalibrationFeedbackNoteUseful(feedback.note) })),
        qualityReviews: session.qualityReviews,
        generationTraces: session.generationTraces,
      })),
    })),
  })
}

export async function runFounderCalibrationJournalReadiness(input: {
  userId: string
  email: string
  founderCalibrationMode?: boolean
}): Promise<FounderCalibrationJournalReadiness> {
  if (input.founderCalibrationMode === false) {
    return buildFounderCalibrationJournalReadiness({ founderCalibrationMode: false, participant: null })
  }

  const participant = await readJournalParticipantSafely(input)
  if (participant.status === "missing_table") {
    return buildFounderCalibrationJournalReadiness({
      founderCalibrationMode: readFounderCalibrationModeFromEnv(input.email),
      participant: null,
    })
  }
  if (!participant.record) {
    return buildFounderCalibrationJournalReadiness({
      founderCalibrationMode: input.founderCalibrationMode ?? await readFallbackFounderCalibrationMode(input.email),
      participant: null,
    })
  }

  const report = buildFounderCalibrationSetupReportFromSnapshot({
    checkedAt: new Date(),
    filterMode: "db",
    filterWarnings: [],
    participants: [{
      id: participant.record.id,
      email: participant.record.email,
      participantRole: participant.record.participantRole,
      status: participant.record.status,
      userId: participant.record.user?.id ?? participant.record.userId,
      userName: participant.record.user?.name ?? null,
      onboardingComplete: participant.record.user?.onboardingComplete ?? false,
      consentCount: participant.record.user?.consentEvents.length ?? 0,
      consentRecords: participant.record.user?.consentEvents ?? [],
      sessions: (participant.record.user?.councilSessions ?? []).map((session) => ({
        id: session.id,
        journalEntryId: session.journalEntryId,
        createdAt: session.createdAt,
        feedback: session.feedback.map((feedback) => ({ hasFeedback: true, hasNote: isFounderCalibrationFeedbackNoteUseful(feedback.note) })),
        qualityReviews: session.qualityReviews,
        generationTraces: session.generationTraces,
      })),
    }],
  })

  return buildFounderCalibrationJournalReadiness({
    founderCalibrationMode: true,
    participant: report.participants.find((item) => item.userId === input.userId || item.email === input.email.toLowerCase()) ?? null,
  })
}

export function buildFounderCalibrationJournalReadiness(input: {
  founderCalibrationMode: boolean
  participant: FounderCalibrationSetupParticipant | null
}): FounderCalibrationJournalReadiness {
  const { founderCalibrationMode, participant } = input
  if (!founderCalibrationMode) {
    return {
      founderCalibrationMode: false,
      suggestedCalibrationScenario: null,
      needsFounderFirstSessionGuide: false,
      needsFounderFeedbackNote: false,
      founderFeedbackNoteHref: null,
      sessionCount: 0,
      feedbackEvidenceCount: 0,
      feedbackNoteCount: 0,
      reviewedSessionCount: 0,
      goldenExampleCount: 0,
    }
  }

  const suggestedScenario = participant?.scenarioStatus.find((item) => !item.completed)?.scenario
  const suggestedCalibrationScenario = suggestedScenario && suggestedScenario !== "freeform" ? suggestedScenario : null
  const sessionCount = participant?.sessionCount ?? 0
  const feedbackEvidenceCount = participant?.feedbackEvidenceCount ?? 0
  const feedbackNoteCount = participant?.feedbackNoteCount ?? 0
  const reviewedSessionCount = participant?.reviewedSessionCount ?? 0
  const goldenExampleCount = participant?.goldenExampleCount ?? 0

  return {
    founderCalibrationMode,
    suggestedCalibrationScenario,
    needsFounderFirstSessionGuide: founderCalibrationMode && Boolean(participant) && sessionCount === 0,
    needsFounderFeedbackNote: founderCalibrationMode && Boolean(participant) && sessionCount > 0 && feedbackEvidenceCount === 0,
    founderFeedbackNoteHref: participant?.latestSessionHref ?? null,
    sessionCount,
    feedbackEvidenceCount,
    feedbackNoteCount,
    reviewedSessionCount,
    goldenExampleCount,
  }
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
                journalEntryId: true,
                createdAt: true,
                feedback: { select: { id: true, note: true } },
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

async function readJournalParticipantSafely(input: { userId: string; email: string }) {
  try {
    const record = await prisma.founderCalibrationParticipant.findFirst({
      where: {
        status: "active",
        OR: [
          { userId: input.userId },
          { email: input.email.toLowerCase() },
        ],
      },
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
                journalEntryId: true,
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
    return { status: "ok" as const, record }
  } catch (error) {
    if (isMissingFounderParticipantTable(error)) return { status: "missing_table" as const, record: null }
    throw error
  }
}

async function readFallbackFounderCalibrationMode(email: string) {
  const activeParticipantCount = await readActiveFounderParticipantCountSafely()
  if (activeParticipantCount === null) return readFounderCalibrationModeFromEnv(email)
  if (activeParticipantCount > 0) return false
  return readFounderCalibrationModeFromEnv(email)
}

async function readActiveFounderParticipantCountSafely() {
  try {
    return await prisma.founderCalibrationParticipant.count({
      where: { status: "active" },
    })
  } catch (error) {
    if (isMissingFounderParticipantTable(error)) return null
    throw error
  }
}

function readFounderCalibrationModeFromEnv(email: string) {
  const normalizedEmail = email.toLowerCase()
  const envEmails = parseFounderCalibrationEmails(process.env.FOUNDER_CALIBRATION_EMAILS)
  if (envEmails.length > 0) return envEmails.includes(normalizedEmail)
  return !["demo@inner-avatar.ai"].includes(normalizedEmail)
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
    const feedbackEvidenceCount = sessions.reduce((count, session) => count + session.feedback.filter((feedback) => feedback.hasFeedback !== false).length, 0)
    const feedbackNoteCount = sessions.reduce((count, session) => count + session.feedback.filter((feedback) => feedback.hasNote).length, 0)
    const reviewedSessionCount = sessions.filter((session) => session.qualityReviews.length > 0).length
    const goldenExampleCount = sessions.filter((session) => session.qualityReviews.some((review) => READY_LABELS.has(review.label))).length
    const latestSessionHref = sessions[0]?.journalEntryId ? `/journal/${sessions[0].journalEntryId}` : "/journal"

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
      feedbackEvidenceCount,
      feedbackNoteCount,
      reviewedSessionCount,
      goldenExampleCount,
      latestSessionHref,
    })
    const nextAction = chooseParticipantNextAction({
      missingActions,
      scenarioStatus,
      sessionCount: sessions.length,
      feedbackEvidenceCount,
      feedbackNoteCount,
      latestSessionHref,
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
      consentPresent,
      sessionCount: sessions.length,
      feedbackEvidenceCount,
      lastSessionAt: sessions[0]?.createdAt.toISOString() ?? null,
      feedbackNoteCount,
      reviewedSessionCount,
      goldenExampleCount,
      latestSessionHref: sessions.length > 0 ? latestSessionHref : null,
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
    participantsWithFeedbackEvidence: activeParticipants.filter((participant) => participant.feedbackEvidenceCount > 0).length,
    participantsWithFeedbackNotes: activeParticipants.filter((participant) => participant.feedbackNoteCount > 0).length,
    participantsWithGoldenExamples: activeParticipants.filter((participant) => participant.goldenExampleCount > 0).length,
    ready: missingRequiredRoles.length === 0 && missingActions.length === 0,
  }

  const warnings = [...snapshot.filterWarnings]
  if (snapshot.filterMode !== "db") warnings.push("Founder calibration participant setup is incomplete; DB participants should be configured before relying on reports.")
  for (const participant of activeParticipants) {
    if (participant.sessionCount > 0 && participant.feedbackEvidenceCount === 0) {
      warnings.push(`${participant.email} has sessions without feedback; choose a feedback type on the saved session so review has usable evidence.`)
    } else if (participant.sessionCount > 0 && participant.feedbackNoteCount === 0) {
      warnings.push(`${participant.email} has feedback types but no written notes; continue development, and add notes only when a specific tuning detail matters.`)
    }
    if (participant.sessionCount > 0 && participant.goldenExampleCount === 0) {
      warnings.push(`${participant.email} has no ready/golden example yet; continue development, but mark examples when a session is clearly reusable.`)
    }
  }

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
      feedbackNotePresent: participant.feedbackEvidenceCount > 0,
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
    feedbackNotePresent: participant.feedbackEvidenceCount > 0,
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

function chooseParticipantNextAction(input: {
  missingActions: FounderCalibrationMissingAction[]
  scenarioStatus: FounderCalibrationParticipantScenarioStatus[]
  sessionCount: number
  feedbackEvidenceCount: number
  feedbackNoteCount: number
  latestSessionHref: string
}) {
  const { missingActions, scenarioStatus, sessionCount, feedbackEvidenceCount, latestSessionHref } = input
  const primaryMissingAction = missingActions[0]
  if (primaryMissingAction) return { message: primaryMissingAction.message, href: primaryMissingAction.href ?? readFounderLaunchHref(primaryMissingAction.code) }
  if (sessionCount > 0 && feedbackEvidenceCount === 0) {
    return { message: "Choose one feedback type on the latest saved session.", href: latestSessionHref }
  }
  const nextScenario = scenarioStatus.find((item) => !item.completed)
  if (nextScenario) {
    const scenarioLabel = formatFounderCalibrationScenario(nextScenario.scenario)
    if (sessionCount > 0) return { message: `First session captured. Next useful pass: ${scenarioLabel}.`, href: "/journal" }
    return { message: `Run the ${scenarioLabel} guided scenario.`, href: "/journal" }
  }
  const scenarioWithoutReadyExample = scenarioStatus.find((item) => item.completed && !item.hasReadyExample)
  if (scenarioWithoutReadyExample) return { message: `Review ${formatFounderCalibrationScenario(scenarioWithoutReadyExample.scenario)} and mark ready or assign an issue.`, href: "/calibration/live" }
  return { message: "Founder calibration launch loop is ready; continue with the next real session.", href: "/calibration/live" }
}

function readFounderLaunchHref(code: string) {
  if (code === "account_missing") return "/register"
  if (code === "onboarding_incomplete" || code === "consent_missing") return "/onboarding"
  if (code === "session_missing" || code === "feedback_missing") return "/journal"
  if (code === "golden_example_missing") return "/calibration/live"
  return null
}

function readFounderHandoffHref(participant: FounderCalibrationSetupParticipant) {
  if (!participant.accountExists) return "/register"
  if (!participant.onboardingComplete || !participant.consentPresent) return "/onboarding"
  if (participant.sessionCount === 0) return "/journal"
  if (participant.feedbackEvidenceCount === 0) return participant.latestSessionHref ?? "/journal"
  return "/journal"
}

function buildFounderHandoffText(participant: FounderCalibrationSetupParticipant, primaryHandoffHref: string | null) {
  const firstIncompleteScenario = participant.scenarioStatus.find((item) => !item.completed)
  const suggestedScenario = firstIncompleteScenario?.scenario ?? "voice_test"
  const suggestedScenarioLabel = formatFounderCalibrationScenario(suggestedScenario)
  const primaryPath = primaryHandoffHref ?? "/journal"
  const feedbackInstruction = "Submit one reflection and select a feedback type. Add a short note only if there is a specific voice, source, intensity, embodiment, or phrasing detail to capture."
  if (!participant.accountExists) {
    return `Please register for Supraconscious using ${participant.email}, then complete onboarding. After onboarding, open /journal and use the preselected ${suggestedScenarioLabel} guided calibration prompt. ${feedbackInstruction} Start here: ${primaryPath}`
  }
  if (!participant.onboardingComplete || !participant.consentPresent) {
    return `Please log in as ${participant.email} and complete onboarding/consent. Then open /journal and use the preselected ${suggestedScenarioLabel} guided calibration prompt. ${feedbackInstruction} Continue here: ${primaryPath}`
  }
  if (participant.sessionCount === 0) {
    return `Please open /journal and use the preselected ${suggestedScenarioLabel} guided calibration prompt. ${feedbackInstruction} Start here: ${primaryPath}`
  }
  if (participant.feedbackEvidenceCount === 0) {
    return `The first session is captured. Choose one feedback type on the saved session so review has usable evidence. Continue here: ${primaryPath}`
  }
  if (participant.goldenExampleCount === 0) {
    return `The first calibration evidence is captured. Golden examples are optional now; continue with the next useful guided session or mark examples later when one clearly stands out. Continue here: ${primaryPath}`
  }
  return `Founder calibration is ready for another guided session. Open /journal, use the next useful guided scenario, and choose a feedback type after the reflection. Add a note only when a specific tuning detail matters. Continue here: ${primaryPath}`
}

function buildParticipantMissingActions(input: {
  email: string
  status: string
  accountExists: boolean
  onboardingComplete: boolean
  consentCount: number
  consentPresent: boolean
  sessionCount: number
  feedbackEvidenceCount: number
  feedbackNoteCount: number
  reviewedSessionCount: number
  goldenExampleCount: number
  latestSessionHref?: string
}) {
  if (input.status !== "active") return []
  const actions: FounderCalibrationMissingAction[] = []
  if (!input.accountExists) actions.push({ code: "account_missing", email: input.email, message: `${input.email} needs to register.`, href: "/register" })
  if (input.accountExists && !input.onboardingComplete) actions.push({ code: "onboarding_incomplete", email: input.email, message: `${input.email} needs to complete onboarding.`, href: "/onboarding" })
  if (input.accountExists && !input.consentPresent) actions.push({ code: "consent_missing", email: input.email, message: `${input.email} needs current required pilot consent records.`, href: "/onboarding" })
  if (input.accountExists && input.sessionCount === 0) actions.push({ code: "session_missing", email: input.email, message: `${input.email} needs one guided calibration session.`, href: "/journal" })
  if (input.accountExists && input.sessionCount > 0 && input.feedbackEvidenceCount === 0) {
    actions.push({
      code: "feedback_missing",
      email: input.email,
      message: `${input.email} needs one calibration feedback type on the saved session.`,
      href: input.latestSessionHref ?? "/journal",
    })
  }
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

function normalizeBaseUrl(value: string) {
  return value.replace(/\/+$/, "")
}

function resolveFounderHandoffHref(
  href: string | null,
  email: string | null,
  webAppBaseUrl: string,
  adminAppBaseUrl: string,
) {
  if (!href) return null
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  if (href === "/calibration/live" || href === "/calibration/setup") return `${adminAppBaseUrl}${href}`
  if ((href === "/onboarding" || href.startsWith("/journal")) && email) {
    return `${webAppBaseUrl}/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(href)}`
  }
  if ((href === "/register" || href === "/login") && email) {
    return `${webAppBaseUrl}${href}?email=${encodeURIComponent(email)}`
  }
  if (href.startsWith("/")) return `${webAppBaseUrl}${href}`
  return href
}

function resolveFounderHandoffText(
  text: string,
  email: string | null,
  webAppBaseUrl: string,
  adminAppBaseUrl: string,
) {
  return text.replace(/(^|[\s:])\/(register|login|onboarding|journal(?:\/[^\s]+)?|calibration\/live|calibration\/setup)\b/g, (_match, prefix: string, path: string) => {
    const href = `/${path}`
    return `${prefix}${resolveFounderHandoffHref(href, email, webAppBaseUrl, adminAppBaseUrl) ?? href}`
  })
}
