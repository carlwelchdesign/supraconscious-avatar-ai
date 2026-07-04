import { prisma } from "@inner-avatar/db"

const DEFAULT_EXCLUDED_EMAILS = new Set(["demo@inner-avatar.ai"])
const SOURCE_ISSUE_LABELS = new Set(["source_unsupported", "unsupported"])
const PROMPT_ISSUE_LABELS = new Set(["voice_wrong", "too_generic", "too_intense", "too_vague"])
const READY_LABELS = new Set(["ready", "voice_good", "source_good", "grounded"])

export type FounderCalibrationUser = {
  id: string
  email: string
  name: string | null
  sessionCount: number
  feedbackCount: number
}

export type FounderCalibrationSessionMetrics = {
  totalSessions: number
  ragSessions: number
  noSourceSessions: number
  feedbackNotes: number
  reviewedSessions: number
  unreviewedSessions: number
  readySessions: number
  pilotBlockers: number
}

export type FounderCalibrationTheme = {
  theme: string
  count: number
  sessionIds: string[]
}

export type FounderCalibrationSourceIssue = {
  councilSessionId: string
  userEmail: string
  sourceMode: string
  feedbackTypes: string[]
  selectedSourceTitles: string[]
  selectedChunkIds: string[]
  latestReviewLabel: string | null
  latestReviewReason: string | null
  hasFeedbackNote: boolean
}

export type FounderCalibrationPromptIssue = {
  councilSessionId: string
  userEmail: string
  label: string
  reason: string | null
  issueType: string | null
}

export type FounderCalibrationReport = {
  checkedAt: string
  users: FounderCalibrationUser[]
  sessionMetrics: FounderCalibrationSessionMetrics
  feedbackThemes: FounderCalibrationTheme[]
  sourceGroundingIssues: FounderCalibrationSourceIssue[]
  promptIssues: FounderCalibrationPromptIssue[]
  readySessions: string[]
  blockers: string[]
  recommendations: string[]
}

export type FounderCalibrationSnapshot = {
  checkedAt: Date
  sessions: FounderCalibrationSessionSnapshot[]
}

export type FounderCalibrationSessionSnapshot = {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  sourceMode: string
  feedback: Array<{ feedbackType: string; note: string | null }>
  qualityReviews: Array<{ label: string; severity: string; reason: string | null; metadata: unknown }>
  generationTraces: Array<{
    traceType: string
    validationStatus: string
    sourceChunkId: string | null
    outputJson: unknown
    sourceTitle: string | null
  }>
}

export async function runFounderCalibrationReport(now = new Date()): Promise<FounderCalibrationReport> {
  const users = await prisma.user.findMany({
    where: buildFounderUserWhere(),
    select: { id: true },
  })
  const userIds = users.map((user) => user.id)
  const sessions = userIds.length === 0 ? [] : await prisma.councilSession.findMany({
    where: { userId: { in: userIds } },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      sourceMode: true,
      userId: true,
      user: { select: { email: true, name: true } },
      feedback: { select: { feedbackType: true, note: true } },
      qualityReviews: {
        orderBy: { reviewedAt: "desc" },
        take: 5,
        select: { label: true, severity: true, reason: true, metadata: true },
      },
      generationTraces: {
        where: { traceType: "retrieval" },
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          traceType: true,
          validationStatus: true,
          sourceChunkId: true,
          outputJson: true,
          sourceChunk: { select: { sourceDocument: { select: { title: true } } } },
        },
      },
    },
  })

  return buildFounderCalibrationReportFromSnapshot({
    checkedAt: now,
    sessions: sessions.map((session) => ({
      id: session.id,
      userId: session.userId,
      userEmail: session.user.email,
      userName: session.user.name,
      sourceMode: session.sourceMode,
      feedback: session.feedback,
      qualityReviews: session.qualityReviews,
      generationTraces: session.generationTraces.map((trace) => ({
        traceType: trace.traceType,
        validationStatus: trace.validationStatus,
        sourceChunkId: trace.sourceChunkId,
        outputJson: trace.outputJson,
        sourceTitle: trace.sourceChunk?.sourceDocument.title ?? null,
      })),
    })),
  })
}

export function buildFounderCalibrationReportFromSnapshot(snapshot: FounderCalibrationSnapshot): FounderCalibrationReport {
  const usersById = new Map<string, FounderCalibrationUser>()
  const feedbackThemes = new Map<string, Set<string>>()
  const sourceGroundingIssues: FounderCalibrationSourceIssue[] = []
  const promptIssues: FounderCalibrationPromptIssue[] = []
  const readySessions = new Set<string>()
  let feedbackNotes = 0
  let reviewedSessions = 0
  let pilotBlockers = 0

  for (const session of snapshot.sessions) {
    const user = usersById.get(session.userId) ?? {
      id: session.userId,
      email: session.userEmail,
      name: session.userName,
      sessionCount: 0,
      feedbackCount: 0,
    }
    user.sessionCount += 1
    user.feedbackCount += session.feedback.length
    usersById.set(session.userId, user)

    const latestReview = session.qualityReviews[0]
    if (session.qualityReviews.length > 0) reviewedSessions += 1
    if (session.qualityReviews.some((review) => review.severity === "pilot_blocker")) pilotBlockers += 1
    if (latestReview && READY_LABELS.has(latestReview.label)) readySessions.add(session.id)

    for (const feedback of session.feedback) {
      addTheme(feedbackThemes, feedback.feedbackType, session.id)
      if (feedback.note?.trim()) {
        feedbackNotes += 1
        addTheme(feedbackThemes, "note_provided", session.id)
      }
    }

    for (const review of session.qualityReviews) {
      const issueType = readCalibrationIssueType(review.metadata)
      if (issueType) addTheme(feedbackThemes, issueType, session.id)
      if (SOURCE_ISSUE_LABELS.has(review.label) || issueType === "source_issue") {
        sourceGroundingIssues.push(toSourceIssue(session, review))
      }
      if (PROMPT_ISSUE_LABELS.has(review.label) || issueType === "prompt_issue" || issueType === "voice_mismatch") {
        promptIssues.push({
          councilSessionId: session.id,
          userEmail: session.userEmail,
          label: review.label,
          reason: review.reason,
          issueType,
        })
      }
    }

    if (session.feedback.some((feedback) => feedback.feedbackType === "unsupported_source")) {
      sourceGroundingIssues.push(toSourceIssue(session, latestReview ?? null))
    }
    if (session.feedback.some((feedback) => feedback.feedbackType === "not_accurate" || feedback.feedbackType === "too_intense" || feedback.feedbackType === "unclear")) {
      promptIssues.push({
        councilSessionId: session.id,
        userEmail: session.userEmail,
        label: "user_feedback",
        reason: null,
        issueType: "prompt_issue",
      })
    }
  }

  const totalSessions = snapshot.sessions.length
  const unreviewedSessions = Math.max(totalSessions - reviewedSessions, 0)
  const blockers = [
    totalSessions === 0 ? "No Carl/Maria calibration sessions found." : null,
    sourceGroundingIssues.length > 0 ? `${sourceGroundingIssues.length} source-grounding issue${sourceGroundingIssues.length === 1 ? "" : "s"} need review.` : null,
    promptIssues.length > 0 ? `${promptIssues.length} prompt or voice issue${promptIssues.length === 1 ? "" : "s"} need review.` : null,
    pilotBlockers > 0 ? `${pilotBlockers} pilot blocker review${pilotBlockers === 1 ? "" : "s"} remain open.` : null,
  ].filter((item): item is string => Boolean(item))

  const recommendations = [
    feedbackNotes === 0 ? "Have Carl and Maria leave short notes when feedback is not helpful, too intense, unclear, or source-related." : null,
    unreviewedSessions > 0 ? "Review recent Carl/Maria sessions before changing prompts or inviting more users." : null,
    sourceGroundingIssues.length > 0 ? "Resolve source-grounding issues before expanding retrieval scope." : null,
    promptIssues.length > 0 ? "Group prompt/voice issues before editing prompt templates." : null,
    blockers.length === 0 && readySessions.size > 0 ? "Calibration has ready sessions; use them as examples before the next internal invite." : null,
  ].filter((item): item is string => Boolean(item))

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    users: Array.from(usersById.values()).sort((a, b) => a.email.localeCompare(b.email)),
    sessionMetrics: {
      totalSessions,
      ragSessions: snapshot.sessions.filter((session) => session.sourceMode === "rag").length,
      noSourceSessions: snapshot.sessions.filter((session) => session.sourceMode === "no_eligible_source").length,
      feedbackNotes,
      reviewedSessions,
      unreviewedSessions,
      readySessions: readySessions.size,
      pilotBlockers,
    },
    feedbackThemes: Array.from(feedbackThemes.entries()).map(([theme, sessionIds]) => ({
      theme,
      count: sessionIds.size,
      sessionIds: Array.from(sessionIds),
    })).sort((a, b) => b.count - a.count || a.theme.localeCompare(b.theme)),
    sourceGroundingIssues: dedupeIssues(sourceGroundingIssues),
    promptIssues: dedupePromptIssues(promptIssues),
    readySessions: Array.from(readySessions),
    blockers,
    recommendations,
  }
}

function buildFounderUserWhere() {
  const configuredEmails = (process.env.FOUNDER_CALIBRATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (configuredEmails.length > 0) {
    return { email: { in: configuredEmails } }
  }

  return {
    email: { notIn: Array.from(DEFAULT_EXCLUDED_EMAILS) },
  }
}

function addTheme(themes: Map<string, Set<string>>, theme: string, sessionId: string) {
  const current = themes.get(theme) ?? new Set<string>()
  current.add(sessionId)
  themes.set(theme, current)
}

function toSourceIssue(session: FounderCalibrationSessionSnapshot, review: FounderCalibrationSessionSnapshot["qualityReviews"][number] | null): FounderCalibrationSourceIssue {
  const selectedTraces = session.generationTraces.filter((trace) => trace.sourceChunkId)
  return {
    councilSessionId: session.id,
    userEmail: session.userEmail,
    sourceMode: session.sourceMode,
    feedbackTypes: Array.from(new Set(session.feedback.map((feedback) => feedback.feedbackType))),
    selectedSourceTitles: Array.from(new Set(selectedTraces.map((trace) => readTraceTitle(trace)).filter(isString))),
    selectedChunkIds: selectedTraces.map((trace) => trace.sourceChunkId).filter(isString),
    latestReviewLabel: review?.label ?? null,
    latestReviewReason: review?.reason ?? null,
    hasFeedbackNote: session.feedback.some((feedback) => Boolean(feedback.note?.trim())),
  }
}

function readCalibrationIssueType(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("calibrationIssueType" in metadata)) return null
  const value = (metadata as { calibrationIssueType?: unknown }).calibrationIssueType
  return typeof value === "string" ? value : null
}

function readTraceTitle(trace: FounderCalibrationSessionSnapshot["generationTraces"][number]) {
  const output = trace.outputJson && typeof trace.outputJson === "object"
    ? trace.outputJson as { title?: unknown }
    : {}
  return typeof output.title === "string" ? output.title : trace.sourceTitle
}

function dedupeIssues(issues: FounderCalibrationSourceIssue[]) {
  return Array.from(new Map(issues.map((issue) => [issue.councilSessionId, issue])).values())
}

function dedupePromptIssues(issues: FounderCalibrationPromptIssue[]) {
  return Array.from(new Map(issues.map((issue) => [`${issue.councilSessionId}:${issue.label}:${issue.issueType}`, issue])).values())
}

function isString(value: string | null): value is string {
  return typeof value === "string" && value.length > 0
}
