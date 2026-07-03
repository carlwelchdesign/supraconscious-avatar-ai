import { prisma } from "@inner-avatar/db"
import { runPilotLaunchReadiness, type PilotLaunchBlocker } from "./pilot-launch-readiness.js"

export type PilotIterationFeedbackMetrics = {
  total: number
  helpful: number
  notAccurate: number
  tooIntense: number
  unclear: number
  unsupportedSource: number
  needsReview: number
  addressed: number
}

export type PilotIterationCohortMetrics = {
  activeCohorts: number
  enrolledUsers: number
  firstSessionsCompleted: number
  firstSessionCompletionRate: number
  gateSaves: number
  gateSaveRate: number
  safetyBypassRate: number
}

export type PilotIterationQueueItem = {
  councilSessionId: string
  userEmail: string
  createdAt: string
  sourceMode: string
  feedbackTypes: string[]
  latestReviewLabel: string | null
  latestReviewSeverity: string | null
  disposition: "needs_review" | "reviewed" | "blocked" | "cleared"
}

export type PilotIterationReport = {
  checkedAt: string
  cohortMetrics: PilotIterationCohortMetrics
  feedbackMetrics: PilotIterationFeedbackMetrics
  qualityQueue: PilotIterationQueueItem[]
  safetyQueue: Array<{ id: string; severity: string; reviewStatus: string; createdAt: string }>
  sourceModeMetrics: Record<string, number>
  blockers: PilotLaunchBlocker[]
  recommendations: string[]
}

const REVIEW_FEEDBACK_TYPES = new Set(["not_accurate", "too_intense", "unclear", "unsupported_source"])

export async function runPilotIterationReport(now = new Date()): Promise<PilotIterationReport> {
  const [readiness, feedback, feedbackRows, safetyQueue, councilSafetySnapshots, sourceModes, gateSaves] = await Promise.all([
    runPilotLaunchReadiness(now),
    prisma.councilSessionFeedback.groupBy({
      by: ["feedbackType"],
      _count: { feedbackType: true },
    }),
    prisma.councilSessionFeedback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        councilSession: {
          select: {
            id: true,
            sourceMode: true,
            createdAt: true,
            user: { select: { email: true } },
            qualityReviews: {
              orderBy: { reviewedAt: "desc" },
              take: 1,
              select: { label: true, severity: true, metadata: true },
            },
          },
        },
      },
    }),
    prisma.safetyEvent.findMany({
      where: { reviewStatus: { in: ["unreviewed", "reviewing", "escalated"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, severity: true, reviewStatus: true, createdAt: true },
    }),
    prisma.councilSession.findMany({
      select: { safetySnapshot: true },
    }),
    prisma.councilSession.groupBy({
      by: ["sourceMode"],
      _count: { sourceMode: true },
    }),
    prisma.embodimentGateResponse.count(),
  ])

  const feedbackCounts = Object.fromEntries(feedback.map((item) => [item.feedbackType, item._count.feedbackType]))
  const totalFeedback = feedback.reduce((sum, item) => sum + item._count.feedbackType, 0)
  const queueBySession = new Map<string, PilotIterationQueueItem>()

  for (const row of feedbackRows) {
    const session = row.councilSession
    const review = session.qualityReviews[0]
    const disposition = readDisposition(review?.metadata, row.feedbackType)
    const existing = queueBySession.get(session.id)
    const item = existing ?? {
      councilSessionId: session.id,
      userEmail: session.user.email,
      createdAt: session.createdAt.toISOString(),
      sourceMode: session.sourceMode,
      feedbackTypes: [],
      latestReviewLabel: review?.label ?? null,
      latestReviewSeverity: review?.severity ?? null,
      disposition,
    }
    item.feedbackTypes.push(row.feedbackType)
    if (dispositionPriority(disposition) > dispositionPriority(item.disposition)) {
      item.disposition = disposition
    }
    queueBySession.set(session.id, item)
  }

  const qualityQueue = Array.from(queueBySession.values())
    .filter((item) => item.feedbackTypes.some((type) => REVIEW_FEEDBACK_TYPES.has(type)) || item.disposition !== "reviewed")
    .slice(0, 20)

  const highOrBypassCount = councilSafetySnapshots
    .filter((item) => readSafetySeverity(item.safetySnapshot) === "high")
    .length

  const recommendations = [
    qualityQueue.some((item) => item.disposition === "needs_review") ? "Review unresolved negative or source-related feedback before expanding the pilot." : null,
    safetyQueue.length > 0 ? "Resolve or consciously carry escalated safety items before inviting more users." : null,
    readiness.latestEvalMetadata.ragEnabled ? "RAG is enabled; monitor unsupported-source reports closely." : "Keep RAG off until pilot review workflows stay stable.",
  ].filter((item): item is string => Boolean(item))

  return {
    checkedAt: now.toISOString(),
    cohortMetrics: {
      activeCohorts: readiness.metrics.activeCohorts,
      enrolledUsers: readiness.metrics.enrolledUsers,
      firstSessionsCompleted: readiness.metrics.firstSessionsCompleted,
      firstSessionCompletionRate: percentage(readiness.metrics.firstSessionsCompleted, readiness.metrics.enrolledUsers),
      gateSaves,
      gateSaveRate: percentage(gateSaves, readiness.metrics.firstSessionsCompleted),
      safetyBypassRate: percentage(highOrBypassCount, Math.max(readiness.metrics.firstSessionsCompleted, 1)),
    },
    feedbackMetrics: {
      total: totalFeedback,
      helpful: feedbackCounts.helpful ?? 0,
      notAccurate: feedbackCounts.not_accurate ?? 0,
      tooIntense: feedbackCounts.too_intense ?? 0,
      unclear: feedbackCounts.unclear ?? 0,
      unsupportedSource: feedbackCounts.unsupported_source ?? 0,
      needsReview: qualityQueue.filter((item) => item.disposition === "needs_review").length,
      addressed: qualityQueue.filter((item) => item.disposition !== "needs_review").length,
    },
    qualityQueue,
    safetyQueue: safetyQueue.map((item) => ({
      id: item.id,
      severity: item.severity,
      reviewStatus: item.reviewStatus,
      createdAt: item.createdAt.toISOString(),
    })),
    sourceModeMetrics: Object.fromEntries(sourceModes.map((item) => [item.sourceMode, item._count.sourceMode])),
    blockers: readiness.blockers,
    recommendations,
  }
}

export function readDisposition(metadata: unknown, feedbackType?: string): PilotIterationQueueItem["disposition"] {
  if (metadata && typeof metadata === "object" && "feedbackDisposition" in metadata) {
    const value = (metadata as { feedbackDisposition?: unknown }).feedbackDisposition
    if (value === "reviewed" || value === "blocked" || value === "cleared") return value
  }
  return feedbackType && REVIEW_FEEDBACK_TYPES.has(feedbackType) ? "needs_review" : "reviewed"
}

function percentage(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}

function readSafetySeverity(value: unknown) {
  if (value && typeof value === "object" && "severity" in value) {
    const severity = (value as { severity?: unknown }).severity
    return typeof severity === "string" ? severity : null
  }
  return null
}

function dispositionPriority(disposition: PilotIterationQueueItem["disposition"]) {
  if (disposition === "blocked") return 3
  if (disposition === "needs_review") return 2
  if (disposition === "cleared") return 1
  return 0
}
