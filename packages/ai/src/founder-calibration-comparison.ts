import { prisma } from "@inner-avatar/db"
import {
  FOUNDER_CALIBRATION_SCENARIOS,
  readFounderCalibrationScenario,
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
  qualityReviews: Array<{ label: string; severity: string; metadata: unknown }>
  generationTraces: Array<{ traceType: string; promptVersion: string | null; outputJson: unknown }>
}

const READY_LABELS = new Set(["ready", "voice_good", "source_good", "grounded"])
const SOURCE_LABELS = new Set(["source_unsupported", "unsupported"])
const PROMPT_LABELS = new Set(["voice_wrong", "too_generic", "too_intense", "too_vague", "prompt_regression"])
const EMBODIMENT_LABELS = new Set(["embodiment_weak"])

export async function runFounderCalibrationComparison(now = new Date()): Promise<FounderCalibrationComparisonReport> {
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

  return buildFounderCalibrationComparisonFromSnapshot({
    checkedAt: now,
    sessions: sessions.map((session) => ({
      id: session.id,
      sourceMode: session.sourceMode,
      feedbackTypes: session.feedback.map((feedback) => feedback.feedbackType),
      qualityReviews: session.qualityReviews,
      generationTraces: session.generationTraces,
    })),
  })
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

    const needsReview = !latestReview || session.feedbackTypes.some((type) => ["not_accurate", "too_intense", "unclear", "unsupported_source"].includes(type))
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

function buildFounderUserWhere() {
  const emails = (process.env.FOUNDER_CALIBRATION_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  if (emails.length > 0) return { email: { in: emails } }
  return { email: { notIn: ["demo@inner-avatar.ai"] } }
}

function readSessionScenario(session: FounderCalibrationComparisonSession) {
  const output = session.generationTraces.find((trace) => trace.traceType === "council")?.outputJson
  if (!output || typeof output !== "object" || !("calibration" in output)) return "freeform"
  const calibration = (output as { calibration?: unknown }).calibration
  if (!calibration || typeof calibration !== "object" || !("scenario" in calibration)) return "freeform"
  return readFounderCalibrationScenario((calibration as { scenario?: unknown }).scenario)
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
  if (session.feedbackTypes.length > 0) return "Review feedback and mark ready or assign a specific issue label."
  return "Run a human review and choose ready, prompt, source, voice, intensity, or embodiment disposition."
}

function buildNextActions(totalSessions: number, goldenCount: number, unresolvedIssues: FounderCalibrationComparisonIssue[]) {
  if (totalSessions === 0) return ["Run one Carl/Maria guided calibration session."]
  if (goldenCount === 0) return ["Mark at least one ready session as a golden example before comparing prompt changes."]
  if (unresolvedIssues.length > 0) return ["Resolve the highest-priority unresolved calibration issue before editing prompt or source material."]
  return ["Run the next guided scenario that has no golden example yet."]
}
