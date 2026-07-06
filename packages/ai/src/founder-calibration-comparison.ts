import { prisma } from "@inner-avatar/db"
import { resolveFounderCalibrationUserFilter } from "./founder-calibration-participants.js"
import {
  FOUNDER_CALIBRATION_SCENARIOS,
  readFounderCalibrationScenarioFromTraceOrText,
  type FounderCalibrationScenario,
} from "./founder-calibration-scenarios.js"

export type FounderCalibrationComparisonScenario = {
  scenario: FounderCalibrationScenario
  totalSessions: number
  reviewedSessions: number
  goldenExamples: number
  unresolvedIssues: number
}

export type FounderCalibrationComparisonGoldenExample = {
  councilSessionId: string
  scenario: FounderCalibrationScenario
  promptVersion: string | null
  reviewLabel: string
}

export type FounderCalibrationComparisonIssue = {
  councilSessionId: string
  scenario: FounderCalibrationScenario
  promptVersion: string | null
  latestReviewLabel: string | null
  latestReviewSeverity: string | null
  nextAction: string
}

export type FounderCalibrationComparisonReport = {
  checkedAt: string
  scenarioCoverage: FounderCalibrationComparisonScenario[]
  promptVersions: Array<{ promptVersion: string; count: number }>
  goldenExamples: FounderCalibrationComparisonGoldenExample[]
  unresolvedIssues: FounderCalibrationComparisonIssue[]
  nextActions: string[]
}

export type FounderCalibrationComparisonSnapshot = {
  checkedAt: Date
  sessions: FounderCalibrationComparisonSession[]
}

export type FounderCalibrationComparisonSession = {
  id: string
  sourceMode: string
  feedbackTypes: string[]
  journalText?: string | null
  qualityReviews: Array<{ label: string; severity: string; metadata: unknown }>
  generationTraces: Array<{ traceType: string; promptVersion: string | null; outputJson: unknown }>
}

const READY_LABELS = new Set(["ready", "voice_good", "source_good", "grounded"])
const SOURCE_LABELS = new Set(["source_unsupported", "unsupported"])
const PROMPT_LABELS = new Set(["voice_wrong", "too_generic", "too_intense", "too_vague", "prompt_regression"])
const EMBODIMENT_LABELS = new Set(["embodiment_weak"])

export async function runFounderCalibrationComparison(now = new Date()): Promise<FounderCalibrationComparisonReport> {
  const filter = await resolveFounderCalibrationUserFilter()
  const users = await prisma.user.findMany({
    where: filter.where,
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
      journalEntry: { select: { rawText: true } },
      feedback: { select: { feedbackType: true } },
      qualityReviews: {
        orderBy: { reviewedAt: "desc" },
        take: 5,
        select: { label: true, severity: true, metadata: true },
      },
      generationTraces: {
        where: { traceType: "council" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { traceType: true, promptVersion: true, outputJson: true },
      },
    },
  })

  const report = buildFounderCalibrationComparisonFromSnapshot({
    checkedAt: now,
    sessions: sessions.map((session) => ({
      id: session.id,
      sourceMode: session.sourceMode,
      journalText: session.journalEntry?.rawText ?? null,
      feedbackTypes: session.feedback.map((feedback) => feedback.feedbackType),
      qualityReviews: session.qualityReviews,
      generationTraces: session.generationTraces,
    })),
  })

  return {
    ...report,
    nextActions: [...filter.warnings, ...report.nextActions],
  }
}

export function buildFounderCalibrationComparisonFromSnapshot(snapshot: FounderCalibrationComparisonSnapshot): FounderCalibrationComparisonReport {
  const coverage = new Map<FounderCalibrationScenario, FounderCalibrationComparisonScenario>()
  const promptVersions = new Map<string, number>()
  const goldenExamples: FounderCalibrationComparisonGoldenExample[] = []
  const unresolvedIssues: FounderCalibrationComparisonIssue[] = []

  for (const scenario of FOUNDER_CALIBRATION_SCENARIOS) {
    coverage.set(scenario, { scenario, totalSessions: 0, reviewedSessions: 0, goldenExamples: 0, unresolvedIssues: 0 })
  }

  for (const session of snapshot.sessions) {
    const scenario = readSessionScenario(session)
    const promptVersion = readPromptVersion(session)
    const latestReview = session.qualityReviews[0] ?? null
    const stats = coverage.get(scenario)!
    stats.totalSessions += 1
    if (latestReview) stats.reviewedSessions += 1
    if (promptVersion) promptVersions.set(promptVersion, (promptVersions.get(promptVersion) ?? 0) + 1)

    if (latestReview && READY_LABELS.has(latestReview.label)) {
      stats.goldenExamples += 1
      goldenExamples.push({
        councilSessionId: session.id,
        scenario,
        promptVersion,
        reviewLabel: latestReview.label,
      })
      continue
    }

    const needsReview = !READY_LABELS.has(latestReview?.label ?? "") && session.feedbackTypes.some((type) => ["not_accurate", "too_intense", "unclear", "unsupported_source"].includes(type))
    const hasIssueLabel = session.qualityReviews.some((review) => isIssueReview(review.label, review.severity))
    if (needsReview || hasIssueLabel) {
      stats.unresolvedIssues += 1
      unresolvedIssues.push({
        councilSessionId: session.id,
        scenario,
        promptVersion,
        latestReviewLabel: latestReview?.label ?? null,
        latestReviewSeverity: latestReview?.severity ?? null,
        nextAction: chooseNextAction(session),
      })
    }
  }

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    scenarioCoverage: Array.from(coverage.values()).filter((item) => item.totalSessions > 0),
    promptVersions: Array.from(promptVersions.entries()).map(([promptVersion, count]) => ({ promptVersion, count })).sort((a, b) => b.count - a.count || a.promptVersion.localeCompare(b.promptVersion)),
    goldenExamples,
    unresolvedIssues,
    nextActions: buildNextActions(snapshot.sessions.length, goldenExamples.length, unresolvedIssues),
  }
}

function readSessionScenario(session: FounderCalibrationComparisonSession) {
  return readFounderCalibrationScenarioFromTraceOrText(session)
}

function readPromptVersion(session: FounderCalibrationComparisonSession) {
  return session.generationTraces.find((trace) => trace.traceType === "council")?.promptVersion ?? null
}

function isIssueReview(label: string, severity: string) {
  return severity === "pilot_blocker" || SOURCE_LABELS.has(label) || PROMPT_LABELS.has(label) || EMBODIMENT_LABELS.has(label)
}

function chooseNextAction(session: FounderCalibrationComparisonSession) {
  const labels = new Set(session.qualityReviews.map((review) => review.label))
  if (session.feedbackTypes.includes("unsupported_source") || [...labels].some((label) => SOURCE_LABELS.has(label))) return "Review source grounding in /admin/sources."
  if ([...labels].some((label) => PROMPT_LABELS.has(label))) return "Compare against golden examples and tune /admin/prompts manually."
  if ([...labels].some((label) => EMBODIMENT_LABELS.has(label))) return "Review the Embodiment Gate response and retry with a smaller shift."
  if (session.feedbackTypes.length > 0) return "Use feedback to choose the next guided scenario; mark ready only if it is clearly reusable."
  return "Run the next guided scenario or add a feedback type if this session should inform tuning."
}

function buildNextActions(totalSessions: number, goldenCount: number, unresolvedIssues: FounderCalibrationComparisonIssue[]) {
  if (totalSessions === 0) return ["Run one Carl/Maria guided calibration session."]
  if (unresolvedIssues.length > 0) return ["Resolve the highest-priority unresolved calibration issue before editing prompt or source material."]
  if (goldenCount === 0) return ["Run the next guided scenario; mark a golden example only when one clearly stands out."]
  return ["Keep running guided scenarios and compare against ready examples when tuning prompts."]
}
