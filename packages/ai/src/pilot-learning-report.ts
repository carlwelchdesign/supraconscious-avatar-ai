import { prisma } from "@inner-avatar/db"
import { runPilotLaunchReadiness, type PilotLaunchBlocker } from "./pilot-launch-readiness.js"

const NEGATIVE_FEEDBACK_TYPES = new Set(["not_accurate", "too_intense", "unclear", "unsupported_source"])

export type PilotLearningFeedbackMetrics = {
  total: number
  helpful: number
  notAccurate: number
  tooIntense: number
  unclear: number
  unsupportedSource: number
}

export type PilotLearningReviewCoverage = {
  sourceSessions: number
  reviewedSourceSessions: number
  unreviewedSourceSessions: number
  coverageRate: number
  pilotBlockers: number
}

export type PilotLearningQueueItem = {
  councilSessionId: string
  userEmail: string
  createdAt: string
  sourceMode: string
  feedbackTypes: string[]
  latestReviewLabel: string | null
  latestReviewSeverity: string | null
  hasLatestReviewReason: boolean
  disposition: "needs_review" | "reviewed" | "blocked" | "cleared"
  selectedSourceTitles: string[]
  selectedChunkIds: string[]
  matchReasons: string[]
  fallbackReason: string | null
  validationStatus: string | null
  validationWarnings: string[]
  validationFailedRules: string[]
  citationCoverage: number | null
  evidenceCoverage: number | null
  displayExcerptSuppressed: boolean
}

export type PilotLearningSourceGroundingMetrics = {
  retrievalTraceCount: number
  selectedTraceCount: number
  noEligibleSourceTraceCount: number
  paraphraseOnlySelections: number
  displayExcerptCount: number
  uniqueSelectedSourceTitles: string[]
}

export type PilotLearningReport = {
  checkedAt: string
  sourceModeMetrics: Record<string, number>
  feedbackMetrics: PilotLearningFeedbackMetrics
  reviewCoverage: PilotLearningReviewCoverage
  ragLearningQueue: PilotLearningQueueItem[]
  safetyQueue: Array<{ id: string; severity: string; reviewStatus: string; createdAt: string }>
  sourceGroundingMetrics: PilotLearningSourceGroundingMetrics
  blockers: PilotLaunchBlocker[]
  recommendations: string[]
}

export type PilotLearningSnapshot = {
  checkedAt: Date
  sourceModeRows: Array<{ sourceMode: string; count: number }>
  feedbackRows: Array<{ feedbackType: string; count: number }>
  safetyRows: Array<{ id: string; severity: string; reviewStatus: string; createdAt: Date }>
  sessions: PilotLearningSessionSnapshot[]
  blockers: PilotLaunchBlocker[]
}

export type PilotLearningSessionSnapshot = {
  id: string
  userEmail: string
  createdAt: Date
  sourceMode: string
  feedbackTypes: string[]
  qualityReviews: Array<{ label: string; severity: string; reason?: string | null; metadata: unknown }>
  generationTraces: Array<{
    traceType: string
    validationStatus: string
    fallbackReason: string | null
    sourceChunkId: string | null
    outputJson: unknown
    sourceTitle: string | null
  }>
}

export async function runPilotLearningReport(now = new Date()): Promise<PilotLearningReport> {
  const [readiness, sourceModes, feedback, safetyRows, sessions] = await Promise.all([
    runPilotLaunchReadiness(now),
    prisma.councilSession.groupBy({
      by: ["sourceMode"],
      _count: { sourceMode: true },
    }),
    prisma.councilSessionFeedback.groupBy({
      by: ["feedbackType"],
      _count: { feedbackType: true },
    }),
    prisma.safetyEvent.findMany({
      where: { reviewStatus: { in: ["unreviewed", "reviewing", "escalated"] } },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, severity: true, reviewStatus: true, createdAt: true },
    }),
    prisma.councilSession.findMany({
      where: {
        OR: [
          { sourceMode: { in: ["rag", "no_eligible_source"] } },
          { feedback: { some: { feedbackType: { in: Array.from(NEGATIVE_FEEDBACK_TYPES) } } } },
          { generationTraces: { some: { validationStatus: "pilot_validation_failed" } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        createdAt: true,
        sourceMode: true,
        user: { select: { email: true } },
        feedback: { select: { feedbackType: true } },
        qualityReviews: {
          orderBy: { reviewedAt: "desc" },
          take: 1,
          select: { label: true, severity: true, reason: true, metadata: true },
        },
        generationTraces: {
          where: { traceType: { in: ["retrieval", "council"] } },
          orderBy: { createdAt: "desc" },
          take: 20,
          select: {
            traceType: true,
            validationStatus: true,
            fallbackReason: true,
            sourceChunkId: true,
            outputJson: true,
            sourceChunk: { select: { sourceDocument: { select: { title: true } } } },
          },
        },
      },
    }),
  ])

  return buildPilotLearningReportFromSnapshot({
    checkedAt: now,
    sourceModeRows: sourceModes.map((row) => ({ sourceMode: row.sourceMode, count: row._count.sourceMode })),
    feedbackRows: feedback.map((row) => ({ feedbackType: row.feedbackType, count: row._count.feedbackType })),
    safetyRows,
    sessions: sessions.map((session) => ({
      id: session.id,
      userEmail: session.user.email,
      createdAt: session.createdAt,
      sourceMode: session.sourceMode,
      feedbackTypes: session.feedback.map((item) => item.feedbackType),
      qualityReviews: session.qualityReviews,
      generationTraces: session.generationTraces.map((trace) => ({
        traceType: trace.traceType,
        validationStatus: trace.validationStatus,
        fallbackReason: trace.fallbackReason,
        sourceChunkId: trace.sourceChunkId,
        outputJson: trace.outputJson,
        sourceTitle: trace.sourceChunk?.sourceDocument.title ?? null,
      })),
    })),
    blockers: readiness.blockers,
  })
}

export function buildPilotLearningReportFromSnapshot(snapshot: PilotLearningSnapshot): PilotLearningReport {
  const feedbackCounts = Object.fromEntries(snapshot.feedbackRows.map((row) => [row.feedbackType, row.count]))
  const sourceModeMetrics = Object.fromEntries(snapshot.sourceModeRows.map((row) => [row.sourceMode, row.count]))
  const sourceSessions = snapshot.sessions.filter((session) => session.sourceMode === "rag" || session.sourceMode === "no_eligible_source")
  const reviewedSourceSessions = sourceSessions.filter((session) => session.qualityReviews.length > 0).length
  const pilotBlockers = snapshot.sessions.filter((session) => session.qualityReviews[0]?.severity === "pilot_blocker").length
  const ragLearningQueue = snapshot.sessions
    .map(toLearningQueueItem)
    .filter((item) => shouldQueueItem(item))
    .slice(0, 30)

  const allRetrievalTraces = snapshot.sessions.flatMap((session) => session.generationTraces.filter((trace) => trace.traceType === "retrieval"))
  const selectedRetrievalTraces = allRetrievalTraces.filter((trace) => trace.sourceChunkId)
  const uniqueSelectedSourceTitles = Array.from(new Set(selectedRetrievalTraces.map((trace) => readTraceTitle(trace)).filter(isString)))

  const recommendations = [
    ragLearningQueue.some((item) => item.disposition === "needs_review") ? "Review open RAG learning queue items before inviting more internal users." : null,
    (feedbackCounts.unsupported_source ?? 0) > 0 ? "Inspect unsupported-source feedback and rollback RAG if reports cluster around the same source claim." : null,
    pilotBlockers > 0 ? "Clear pilot-blocker quality reviews before expanding the pilot." : null,
    sourceSessions.length > reviewedSourceSessions ? "Increase review coverage for source-grounded and no-source sessions." : null,
  ].filter((item): item is string => Boolean(item))

  return {
    checkedAt: snapshot.checkedAt.toISOString(),
    sourceModeMetrics,
    feedbackMetrics: {
      total: snapshot.feedbackRows.reduce((sum, row) => sum + row.count, 0),
      helpful: feedbackCounts.helpful ?? 0,
      notAccurate: feedbackCounts.not_accurate ?? 0,
      tooIntense: feedbackCounts.too_intense ?? 0,
      unclear: feedbackCounts.unclear ?? 0,
      unsupportedSource: feedbackCounts.unsupported_source ?? 0,
    },
    reviewCoverage: {
      sourceSessions: sourceSessions.length,
      reviewedSourceSessions,
      unreviewedSourceSessions: Math.max(sourceSessions.length - reviewedSourceSessions, 0),
      coverageRate: percentage(reviewedSourceSessions, sourceSessions.length),
      pilotBlockers,
    },
    ragLearningQueue,
    safetyQueue: snapshot.safetyRows.map((row) => ({
      id: row.id,
      severity: row.severity,
      reviewStatus: row.reviewStatus,
      createdAt: row.createdAt.toISOString(),
    })),
    sourceGroundingMetrics: {
      retrievalTraceCount: allRetrievalTraces.length,
      selectedTraceCount: selectedRetrievalTraces.length,
      noEligibleSourceTraceCount: allRetrievalTraces.filter((trace) => trace.validationStatus === "no_eligible_source").length,
      paraphraseOnlySelections: selectedRetrievalTraces.filter((trace) => readTraceAllowedUse(trace) === "paraphrase_generation").length,
      displayExcerptCount: selectedRetrievalTraces.filter((trace) => Boolean(readTraceDisplayExcerpt(trace))).length,
      uniqueSelectedSourceTitles,
    },
    blockers: snapshot.blockers,
    recommendations,
  }
}

function toLearningQueueItem(session: PilotLearningSessionSnapshot): PilotLearningQueueItem {
  const latestReview = session.qualityReviews[0]
  const feedbackDisposition = readFeedbackDisposition(latestReview?.metadata, session.feedbackTypes)
  const retrievalTraces = session.generationTraces.filter((trace) => trace.traceType === "retrieval")
  const selectedTraces = retrievalTraces.filter((trace) => trace.sourceChunkId)
  const councilTrace = session.generationTraces.find((trace) => trace.traceType === "council")
  const pilotValidation = readPilotValidation(councilTrace?.outputJson)
  const fallbackReason = retrievalTraces.find((trace) => trace.fallbackReason)?.fallbackReason ?? null

  return {
    councilSessionId: session.id,
    userEmail: session.userEmail,
    createdAt: session.createdAt.toISOString(),
    sourceMode: session.sourceMode,
    feedbackTypes: Array.from(new Set(session.feedbackTypes)),
    latestReviewLabel: latestReview?.label ?? null,
    latestReviewSeverity: latestReview?.severity ?? null,
    hasLatestReviewReason: Boolean(latestReview?.reason?.trim()),
    disposition: feedbackDisposition,
    selectedSourceTitles: Array.from(new Set(selectedTraces.map((trace) => readTraceTitle(trace)).filter(isString))),
    selectedChunkIds: selectedTraces.map((trace) => trace.sourceChunkId).filter((id): id is string => Boolean(id)),
    matchReasons: Array.from(new Set(selectedTraces.map((trace) => readTraceMatchReason(trace)).filter(isString))),
    fallbackReason,
    validationStatus: councilTrace?.validationStatus ?? null,
    validationWarnings: pilotValidation.warnings,
    validationFailedRules: pilotValidation.failedRules,
    citationCoverage: pilotValidation.citationCoverage,
    evidenceCoverage: pilotValidation.evidenceCoverage,
    displayExcerptSuppressed: selectedTraces.some((trace) => readTraceAllowedUse(trace) === "paraphrase_generation" && !readTraceDisplayExcerpt(trace)),
  }
}

function shouldQueueItem(item: PilotLearningQueueItem) {
  return item.sourceMode === "rag" ||
    item.sourceMode === "no_eligible_source" ||
    item.feedbackTypes.some((type) => NEGATIVE_FEEDBACK_TYPES.has(type)) ||
    item.validationWarnings.length > 0 ||
    item.validationFailedRules.length > 0 ||
    item.disposition === "needs_review" ||
    !item.latestReviewLabel
}

export function readFeedbackDisposition(
  metadata: unknown,
  feedbackTypes: string[] = [],
): PilotLearningQueueItem["disposition"] {
  if (metadata && typeof metadata === "object" && "feedbackDisposition" in metadata) {
    const value = (metadata as { feedbackDisposition?: unknown }).feedbackDisposition
    if (value === "reviewed" || value === "blocked" || value === "cleared") return value
  }
  return feedbackTypes.some((type) => NEGATIVE_FEEDBACK_TYPES.has(type)) ? "needs_review" : "reviewed"
}

function readPilotValidation(value: unknown) {
  const empty = {
    warnings: [] as string[],
    failedRules: [] as string[],
    citationCoverage: null as number | null,
    evidenceCoverage: null as number | null,
  }
  if (!value || typeof value !== "object" || !("pilotValidation" in value)) return empty
  const validation = (value as { pilotValidation?: unknown }).pilotValidation
  if (!validation || typeof validation !== "object") return empty
  const record = validation as {
    warnings?: unknown
    failedRules?: unknown
    citationCoverage?: unknown
    evidenceCoverage?: unknown
  }
  return {
    warnings: Array.isArray(record.warnings) ? record.warnings.filter((item): item is string => typeof item === "string") : [],
    failedRules: Array.isArray(record.failedRules) ? record.failedRules.filter((item): item is string => typeof item === "string") : [],
    citationCoverage: typeof record.citationCoverage === "number" ? record.citationCoverage : null,
    evidenceCoverage: typeof record.evidenceCoverage === "number" ? record.evidenceCoverage : null,
  }
}

function readTraceTitle(trace: PilotLearningSessionSnapshot["generationTraces"][number]) {
  const output = readTraceOutput(trace)
  return output.title ?? trace.sourceTitle ?? null
}

function readTraceMatchReason(trace: PilotLearningSessionSnapshot["generationTraces"][number]) {
  return readTraceOutput(trace).matchReason ?? null
}

function readTraceAllowedUse(trace: PilotLearningSessionSnapshot["generationTraces"][number]) {
  return readTraceOutput(trace).allowedUse ?? null
}

function readTraceDisplayExcerpt(trace: PilotLearningSessionSnapshot["generationTraces"][number]) {
  return readTraceOutput(trace).displayExcerpt ?? null
}

function readTraceOutput(trace: PilotLearningSessionSnapshot["generationTraces"][number]) {
  if (!trace.outputJson || typeof trace.outputJson !== "object") {
    return {} as {
      title?: string
      matchReason?: string
      allowedUse?: string
      displayExcerpt?: string | null
    }
  }
  return trace.outputJson as {
    title?: string
    matchReason?: string
    allowedUse?: string
    displayExcerpt?: string | null
  }
}

function percentage(numerator: number, denominator: number) {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 100)
}

function isString(value: string | null): value is string {
  return typeof value === "string" && value.length > 0
}
