import { prisma } from "@inner-avatar/db"
import { runKeywordRagEvals, type RagEvalReport } from "./rag-eval.js"
import { runPilotCouncilEvals, type PilotCouncilEvalReport } from "./pilot-council-eval.js"
import { evaluateSourceEligibility } from "./source-policy.js"

export type PilotLaunchBlockerCode =
  | "no_active_cohort"
  | "no_pilot_users"
  | "orientation_incomplete"
  | "unresolved_safety_reviews"
  | "quality_blockers"
  | "council_mode_disabled"
  | "rag_enabled_without_activation_eval"
  | "rag_eval_failed"
  | "pilot_eval_failed"
  | "missing_product_doctrine_allowlist"
  | "missing_current_month_curriculum"
  | "manuscript_retrieval_eligible"
  | "database_schema_not_ready"

export type PilotLaunchBlocker = {
  code: PilotLaunchBlockerCode
  message: string
  href?: string
  count?: number
}

export type PilotLaunchMetrics = {
  activeCohorts: number
  enrolledUsers: number
  orientationCompleteUsers: number
  firstSessionsCompleted: number
  embodimentGateSaves: number
  unresolvedSafetyReviews: number
  qualityBlockers: number
  feedbackTotal: number
  sourceModeCounts: Record<string, number>
}

export type PilotLaunchSourceReadiness = {
  productDoctrineEligibleChunks: number
  currentMonthApprovedCurriculumDays: number
  currentMonthEligibleCurriculumChunks: number
  manuscriptEligibleChunks: number
  checkedMonth: number
}

export type PilotLaunchEvalMetadata = {
  rag: Pick<RagEvalReport, "passed" | "total" | "failed">
  pilot: Pick<PilotCouncilEvalReport, "passed" | "total" | "failed">
  ragActivationEvalPassed: boolean
  ragEnabled: boolean
  councilModeEnabled: boolean
}

export type PilotLaunchReadinessSnapshot = {
  metrics: PilotLaunchMetrics
  sourceReadiness: PilotLaunchSourceReadiness
  latestEvalMetadata: PilotLaunchEvalMetadata
}

export type PilotLaunchReadinessReport = PilotLaunchReadinessSnapshot & {
  passed: boolean
  checkedAt: string
  blockers: PilotLaunchBlocker[]
  warnings: string[]
}

export async function runPilotLaunchReadiness(now = new Date()): Promise<PilotLaunchReadinessReport> {
  let metrics: PilotLaunchMetrics
  let sourceReadiness: PilotLaunchSourceReadiness
  let flags: Array<{ key: string; enabled: boolean; metadata: unknown }>
  let schemaBlocker: PilotLaunchBlocker | null = null

  try {
    if (await isPilotSchemaReady()) {
      [metrics, sourceReadiness, flags] = await Promise.all([
        getPilotLaunchMetrics(),
        getPilotLaunchSourceReadiness(now),
        prisma.featureFlag.findMany({
          where: { key: { in: ["council_mode", "rag_enabled"] } },
          select: { key: true, enabled: true, metadata: true },
        }),
      ])
    } else {
      metrics = emptyMetrics()
      sourceReadiness = emptySourceReadiness(now)
      flags = []
      schemaBlocker = {
        code: "database_schema_not_ready",
        message: "Apply the latest Prisma migrations before using pilot launch readiness.",
        count: 1,
      }
    }
  } catch (error) {
    if (!isMissingTableError(error)) throw error
    metrics = emptyMetrics()
    sourceReadiness = emptySourceReadiness(now)
    flags = []
    schemaBlocker = {
      code: "database_schema_not_ready",
      message: "Apply the latest Prisma migrations before using pilot launch readiness.",
      count: 1,
    }
  }

  const flagByKey = new Map(flags.map((flag) => [flag.key, flag]))
  const ragEval = runKeywordRagEvals()
  const pilotEval = runPilotCouncilEvals()
  const ragFlag = flagByKey.get("rag_enabled")
  const latestEvalMetadata: PilotLaunchEvalMetadata = {
    rag: summarizeEval(ragEval),
    pilot: summarizeEval(pilotEval),
    ragActivationEvalPassed: readActivationEvalPassed(ragFlag?.metadata),
    ragEnabled: ragFlag?.enabled ?? false,
    councilModeEnabled: flagByKey.get("council_mode")?.enabled ?? false,
  }

  const report = evaluatePilotLaunchReadinessSnapshot({
    metrics,
    sourceReadiness,
    latestEvalMetadata,
  }, now)
  if (schemaBlocker) {
    report.blockers.unshift(schemaBlocker)
    report.passed = false
  }
  return report
}

export function evaluatePilotLaunchReadinessSnapshot(
  snapshot: PilotLaunchReadinessSnapshot,
  now = new Date(),
): PilotLaunchReadinessReport {
  const blockers: PilotLaunchBlocker[] = []
  const warnings: string[] = []
  const { metrics, sourceReadiness, latestEvalMetadata } = snapshot

  addBlocker(blockers, metrics.activeCohorts === 0, {
    code: "no_active_cohort",
    message: "Create and activate an internal pilot cohort.",
    href: "/pilot",
  })
  addBlocker(blockers, metrics.enrolledUsers === 0, {
    code: "no_pilot_users",
    message: "Enroll at least one internal pilot user.",
    href: "/pilot",
  })
  addBlocker(blockers, metrics.enrolledUsers > metrics.orientationCompleteUsers, {
    code: "orientation_incomplete",
    message: "Every enrolled pilot user must complete orientation and consent before launch.",
    href: "/pilot",
    count: Math.max(metrics.enrolledUsers - metrics.orientationCompleteUsers, 0),
  })
  addBlocker(blockers, metrics.unresolvedSafetyReviews > 0, {
    code: "unresolved_safety_reviews",
    message: "Resolve open safety reviews before expanding the pilot.",
    href: "/safety",
    count: metrics.unresolvedSafetyReviews,
  })
  addBlocker(blockers, metrics.qualityBlockers > 0, {
    code: "quality_blockers",
    message: "Clear pilot-blocker quality reviews before launch.",
    href: "/council",
    count: metrics.qualityBlockers,
  })
  addBlocker(blockers, !latestEvalMetadata.councilModeEnabled, {
    code: "council_mode_disabled",
    message: "Enable council_mode before running the Inner Council pilot.",
    href: "/feature-flags",
  })
  addBlocker(blockers, latestEvalMetadata.ragEnabled && !latestEvalMetadata.ragActivationEvalPassed, {
    code: "rag_enabled_without_activation_eval",
    message: "Disable RAG or complete the dedicated RAG activation gate with current eval metadata.",
    href: "/sources/readiness",
  })
  addBlocker(blockers, !latestEvalMetadata.rag.passed, {
    code: "rag_eval_failed",
    message: "Keyword RAG evals must pass before pilot launch.",
    href: "/sources/readiness",
    count: latestEvalMetadata.rag.failed,
  })
  addBlocker(blockers, !latestEvalMetadata.pilot.passed, {
    code: "pilot_eval_failed",
    message: "Pilot council evals must pass before pilot launch.",
    href: "/pilot",
    count: latestEvalMetadata.pilot.failed,
  })
  addBlocker(blockers, sourceReadiness.productDoctrineEligibleChunks === 0, {
    code: "missing_product_doctrine_allowlist",
    message: "Approve at least one rights-compatible product doctrine chunk for the pilot allowlist.",
    href: "/sources",
  })
  addBlocker(blockers, sourceReadiness.currentMonthApprovedCurriculumDays === 0 && sourceReadiness.currentMonthEligibleCurriculumChunks === 0, {
    code: "missing_current_month_curriculum",
    message: "Approve current-month curriculum content for the pilot threshold.",
    href: "/sources",
  })
  addBlocker(blockers, sourceReadiness.manuscriptEligibleChunks > 0, {
    code: "manuscript_retrieval_eligible",
    message: "Manuscripts must remain unretrievable for this internal pilot.",
    href: "/sources",
    count: sourceReadiness.manuscriptEligibleChunks,
  })

  if (metrics.firstSessionsCompleted === 0) {
    warnings.push("No first pilot sessions are complete yet. This is acceptable before launch, but should change during the first pilot day.")
  }
  if (metrics.feedbackTotal === 0) {
    warnings.push("No session feedback has been collected yet.")
  }
  if (!latestEvalMetadata.ragEnabled) {
    warnings.push("RAG is off. Pilot reflections may use approved curriculum/product context only after the activation gate enables it.")
  }

  return {
    ...snapshot,
    checkedAt: now.toISOString(),
    passed: blockers.length === 0,
    blockers,
    warnings,
  }
}

async function getPilotLaunchMetrics(): Promise<PilotLaunchMetrics> {
  const [
    activeCohorts,
    enrollments,
    firstSessionsCompleted,
    embodimentGateSaves,
    unresolvedSafetyReviews,
    qualityBlockers,
    feedbackTotal,
    sourceModes,
  ] = await Promise.all([
    prisma.pilotCohort.count({ where: { status: "active" } }),
    prisma.pilotEnrollment.findMany({
      where: { status: { in: ["invited", "active", "completed"] }, removedAt: null },
      select: {
        completedFirstSessionAt: true,
        user: { select: { onboardingComplete: true } },
      },
    }),
    prisma.pilotEnrollment.count({
      where: {
        status: { in: ["active", "completed"] },
        completedFirstSessionAt: { not: null },
        removedAt: null,
      },
    }),
    prisma.embodimentGateResponse.count(),
    prisma.safetyEvent.count({ where: { reviewStatus: { in: ["unreviewed", "reviewing"] } } }),
    prisma.qualityReview.count({ where: { severity: "pilot_blocker" } }),
    prisma.councilSessionFeedback.count(),
    prisma.councilSession.groupBy({
      by: ["sourceMode"],
      _count: { sourceMode: true },
    }),
  ])

  return {
    activeCohorts,
    enrolledUsers: enrollments.length,
    orientationCompleteUsers: enrollments.filter((enrollment) => enrollment.user.onboardingComplete).length,
    firstSessionsCompleted,
    embodimentGateSaves,
    unresolvedSafetyReviews,
    qualityBlockers,
    feedbackTotal,
    sourceModeCounts: Object.fromEntries(sourceModes.map((mode) => [mode.sourceMode, mode._count.sourceMode])),
  }
}

async function isPilotSchemaReady() {
  const rows = await prisma.$queryRaw<Array<{ found: string }>>`
    SELECT 'PilotCohort' as found
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'PilotCohort'
    UNION ALL
    SELECT 'PilotEnrollment' as found
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'PilotEnrollment'
    UNION ALL
    SELECT 'CouncilSessionFeedback' as found
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'CouncilSessionFeedback'
    UNION ALL
    SELECT 'QualityReview' as found
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'QualityReview'
    UNION ALL
    SELECT 'SafetyEvent.reviewStatus' as found
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'SafetyEvent' AND column_name = 'reviewStatus'
  `
  return new Set(rows.map((row) => row.found)).size === 5
}

async function getPilotLaunchSourceReadiness(now: Date): Promise<PilotLaunchSourceReadiness> {
  const checkedMonth = now.getMonth() + 1
  const [chunks, currentMonthApprovedCurriculumDays] = await Promise.all([
    prisma.sourceChunk.findMany({
      where: {
        reviewState: { in: ["approved", "approved_curriculum"] },
        sourceDocument: {
          sourceType: { in: ["product_doctrine", "curriculum", "manuscript"] },
        },
      },
      include: {
        sourceDocument: {
          select: {
            sourceType: true,
            reviewState: true,
            rightsStatus: true,
            rightsGrants: {
              select: {
                status: true,
                allowedUses: true,
                quoteAllowed: true,
                expiresAt: true,
                revokedAt: true,
              },
            },
          },
        },
      },
    }),
    prisma.curriculumDay.count({
      where: {
        month: checkedMonth,
        publishState: { in: ["approved", "approved_curriculum"] },
      },
    }),
  ])

  const eligible = chunks.filter((chunk) =>
    evaluateSourceEligibility(chunk.sourceDocument, chunk, { now }).eligible
  )

  return {
    productDoctrineEligibleChunks: eligible.filter((chunk) => chunk.sourceDocument.sourceType === "product_doctrine").length,
    currentMonthApprovedCurriculumDays,
    currentMonthEligibleCurriculumChunks: eligible.filter((chunk) => chunk.sourceDocument.sourceType === "curriculum").length,
    manuscriptEligibleChunks: eligible.filter((chunk) => chunk.sourceDocument.sourceType === "manuscript").length,
    checkedMonth,
  }
}

function summarizeEval(report: RagEvalReport | PilotCouncilEvalReport) {
  return {
    passed: report.passed,
    total: report.total,
    failed: report.failed,
  }
}

function readActivationEvalPassed(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("evalReport" in metadata)) return false
  const evalReport = (metadata as { evalReport?: unknown }).evalReport
  if (typeof evalReport === "string") {
    try {
      const parsed = JSON.parse(evalReport) as { passed?: unknown }
      return parsed.passed === true
    } catch {
      return false
    }
  }
  return Boolean(evalReport && typeof evalReport === "object" && (evalReport as { passed?: unknown }).passed === true)
}

function addBlocker(blockers: PilotLaunchBlocker[], condition: boolean, blocker: PilotLaunchBlocker) {
  if (condition) blockers.push(blocker)
}

function emptyMetrics(): PilotLaunchMetrics {
  return {
    activeCohorts: 0,
    enrolledUsers: 0,
    orientationCompleteUsers: 0,
    firstSessionsCompleted: 0,
    embodimentGateSaves: 0,
    unresolvedSafetyReviews: 0,
    qualityBlockers: 0,
    feedbackTotal: 0,
    sourceModeCounts: {},
  }
}

function emptySourceReadiness(now: Date): PilotLaunchSourceReadiness {
  return {
    productDoctrineEligibleChunks: 0,
    currentMonthApprovedCurriculumDays: 0,
    currentMonthEligibleCurriculumChunks: 0,
    manuscriptEligibleChunks: 0,
    checkedMonth: now.getMonth() + 1,
  }
}

function isMissingTableError(error: unknown) {
  return Boolean(
    error &&
    typeof error === "object" &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2021"
  )
}
