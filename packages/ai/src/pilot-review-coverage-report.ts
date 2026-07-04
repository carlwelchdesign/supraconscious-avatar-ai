import { runPilotExpansionReadiness, type PilotExpansionBlocker } from "./pilot-expansion-readiness.js"
import { runPilotLearningReport, type PilotLearningQueueItem, type PilotLearningReport } from "./pilot-learning-report.js"

export type PilotReviewPriority =
  | "safety_or_validation"
  | "unsupported_source"
  | "negative_feedback"
  | "unreviewed_rag"
  | "unreviewed_no_source"

export type PilotReviewCoverage = {
  sourceSessions: number
  reviewedSourceSessions: number
  unreviewedSourceSessions: number
  coverageRate: number
  requiredReviewedForExpansion: number
  additionalReviewsNeededFor80Percent: number
  pilotBlockers: number
}

export type PilotReviewCoverageQueueItem = PilotLearningQueueItem & {
  priority: PilotReviewPriority
  priorityRank: number
  reviewHref: string
  rawJournalTextHidden: true
}

export type PilotReviewCoverageReport = {
  checkedAt: string
  coverage: PilotReviewCoverage
  prioritizedQueue: PilotReviewCoverageQueueItem[]
  blockers: PilotExpansionBlocker[]
  warnings: string[]
  recommendations: string[]
}

export type PilotReviewCoverageSnapshot = {
  checkedAt: Date
  learning: Pick<PilotLearningReport, "reviewCoverage" | "ragLearningQueue" | "safetyQueue">
  expansionBlockers: PilotExpansionBlocker[]
  expansionWarnings: string[]
}

const NEGATIVE_FEEDBACK_TYPES = new Set(["not_accurate", "too_intense", "unclear"])

export async function runPilotReviewCoverageReport(now = new Date()): Promise<PilotReviewCoverageReport> {
  const [learning, expansion] = await Promise.all([
    runPilotLearningReport(now),
    runPilotExpansionReadiness(now),
  ])

  return buildPilotReviewCoverageReportFromSnapshot({
    checkedAt: now,
    learning,
    expansionBlockers: expansion.blockers,
    expansionWarnings: expansion.warnings,
  })
}

export function buildPilotReviewCoverageReportFromSnapshot(snapshot: PilotReviewCoverageSnapshot): PilotReviewCoverageReport {
  const requiredReviewedForExpansion = Math.ceil(snapshot.learning.reviewCoverage.sourceSessions * 0.8)
  const additionalReviewsNeededFor80Percent = Math.max(requiredReviewedForExpansion - snapshot.learning.reviewCoverage.reviewedSourceSessions, 0)
  const prioritizedQueue = snapshot.learning.ragLearningQueue
    .filter((item) => shouldIncludeReviewItem(item))
    .map((item) => {
      const priority = classifyPriority(item)
      return {
        ...item,
        priority,
        priorityRank: priorityRank(priority),
        reviewHref: `/council?sessionId=${encodeURIComponent(item.councilSessionId)}`,
        rawJournalTextHidden: true as const,
      }
    })
    .sort((a, b) => a.priorityRank - b.priorityRank || Date.parse(b.createdAt) - Date.parse(a.createdAt))

  const reviewBlockers = snapshot.expansionBlockers.filter((blocker) => [
    "review_coverage_low",
    "unreviewed_source_sessions",
    "unreviewed_negative_feedback",
    "unsupported_source_unreviewed",
    "pilot_blockers_open",
    "new_safety_reviews_open",
  ].includes(blocker.code))

  const recommendations = [
    additionalReviewsNeededFor80Percent > 0
      ? `Review ${additionalReviewsNeededFor80Percent} more source-grounded or no-source session${additionalReviewsNeededFor80Percent === 1 ? "" : "s"} to reach 80% coverage.`
      : null,
    prioritizedQueue.some((item) => item.priority === "safety_or_validation")
      ? "Start with sessions that have safety signals or validation failures."
      : null,
    prioritizedQueue.some((item) => item.priority === "unsupported_source")
      ? "Resolve unsupported-source feedback before pilot expansion."
      : null,
    snapshot.learning.reviewCoverage.pilotBlockers > 0
      ? "Clear pilot-blocker quality reviews before inviting more internal users."
      : null,
  ].filter((item): item is string => Boolean(item))

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    coverage: {
      sourceSessions: snapshot.learning.reviewCoverage.sourceSessions,
      reviewedSourceSessions: snapshot.learning.reviewCoverage.reviewedSourceSessions,
      unreviewedSourceSessions: snapshot.learning.reviewCoverage.unreviewedSourceSessions,
      coverageRate: snapshot.learning.reviewCoverage.coverageRate,
      requiredReviewedForExpansion,
      additionalReviewsNeededFor80Percent,
      pilotBlockers: snapshot.learning.reviewCoverage.pilotBlockers,
    },
    prioritizedQueue,
    blockers: reviewBlockers,
    warnings: snapshot.expansionWarnings,
    recommendations,
  }
}

function shouldIncludeReviewItem(item: PilotLearningQueueItem) {
  return item.disposition === "needs_review" ||
    !item.latestReviewLabel ||
    item.latestReviewSeverity === "pilot_blocker" ||
    item.validationWarnings.length > 0 ||
    item.validationFailedRules.length > 0 ||
    item.feedbackTypes.includes("unsupported_source") ||
    item.feedbackTypes.some((type) => NEGATIVE_FEEDBACK_TYPES.has(type)) ||
    item.sourceMode === "rag" ||
    item.sourceMode === "no_eligible_source"
}

function classifyPriority(item: PilotLearningQueueItem): PilotReviewPriority {
  if (item.latestReviewSeverity === "pilot_blocker" || item.validationFailedRules.length > 0 || item.validationWarnings.length > 0) {
    return "safety_or_validation"
  }
  if (item.feedbackTypes.includes("unsupported_source")) return "unsupported_source"
  if (item.feedbackTypes.some((type) => NEGATIVE_FEEDBACK_TYPES.has(type))) return "negative_feedback"
  if (item.sourceMode === "rag" && !item.latestReviewLabel) return "unreviewed_rag"
  return "unreviewed_no_source"
}

function priorityRank(priority: PilotReviewPriority) {
  const ranks: Record<PilotReviewPriority, number> = {
    safety_or_validation: 1,
    unsupported_source: 2,
    negative_feedback: 3,
    unreviewed_rag: 4,
    unreviewed_no_source: 5,
  }
  return ranks[priority]
}
