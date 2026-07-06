import { createHash } from "node:crypto"
import { prisma } from "@inner-avatar/db"
import { runPilotLaunchReadiness, type PilotLaunchReadinessReport } from "./pilot-launch-readiness.js"
import { runPilotLearningReport, type PilotLearningReport } from "./pilot-learning-report.js"

export type PilotExpansionBlockerCode =
  | "launch_readiness_blocked"
  | "rag_not_active"
  | "review_coverage_low"
  | "unreviewed_source_sessions"
  | "unreviewed_negative_feedback"
  | "unsupported_source_unreviewed"
  | "pilot_blockers_open"
  | "new_safety_reviews_open"
  | "no_active_cohort"

export type PilotExpansionBlocker = {
  code: PilotExpansionBlockerCode
  message: string
  count?: number
  href?: string
}

export type PilotExpansionMetrics = {
  activeCohorts: number
  currentEnrolledUsers: number
  completedFirstSessions: number
  reviewCoverageRate: number
  unreviewedSourceSessions: number
  unresolvedNegativeFeedback: number
  unresolvedUnsupportedSourceFeedback: number
  pilotBlockers: number
  newUnresolvedSafetyItems: number
  ragEnabled: boolean
  ragActivationEvalPassed: boolean
}

export type PilotExpansionLearningSummary = {
  ragSessions: number
  noSourceSessions: number
  selectedTraceCount: number
  noEligibleSourceTraceCount: number
  unsupportedSourceReports: number
}

export type PilotExpansionReadinessReport = {
  passed: boolean
  checkedAt: string
  recommendedBatchSize: { min: number; max: number }
  blockers: PilotExpansionBlocker[]
  warnings: string[]
  metrics: PilotExpansionMetrics
  learningSummary: PilotExpansionLearningSummary
}

export type PilotExpansionSnapshot = {
  checkedAt: Date
  launch: Pick<PilotLaunchReadinessReport, "passed" | "blockers" | "latestEvalMetadata" | "metrics">
  learning: Pick<PilotLearningReport, "reviewCoverage" | "ragLearningQueue" | "feedbackMetrics" | "sourceModeMetrics" | "sourceGroundingMetrics">
}

export async function runPilotExpansionReadiness(now = new Date()): Promise<PilotExpansionReadinessReport> {
  const [launch, learning] = await Promise.all([
    runPilotLaunchReadiness(now),
    runPilotLearningReport(now),
  ])

  return evaluatePilotExpansionReadinessSnapshot({
    checkedAt: now,
    launch,
    learning,
  })
}

export function evaluatePilotExpansionReadinessSnapshot(snapshot: PilotExpansionSnapshot): PilotExpansionReadinessReport {
  const blockers: PilotExpansionBlocker[] = []
  const warnings: string[] = []
  const unresolvedNegativeFeedback = snapshot.learning.ragLearningQueue
    .filter((item) => item.disposition === "needs_review" && item.feedbackTypes.some((type) => ["not_accurate", "too_intense", "unclear", "unsupported_source"].includes(type)))
    .length
  const unresolvedUnsupportedSourceFeedback = snapshot.learning.ragLearningQueue
    .filter((item) => item.disposition === "needs_review" && item.feedbackTypes.includes("unsupported_source"))
    .length
  const activeCohorts = snapshot.launch.metrics.activeCohorts
  const newUnresolvedSafetyItems = snapshot.launch.metrics.unresolvedSafetyReviews

  addBlocker(blockers, !snapshot.launch.passed, {
    code: "launch_readiness_blocked",
    message: "Launch readiness must pass before expanding the internal pilot.",
    count: snapshot.launch.blockers.length,
    href: "/pilot",
  })
  addBlocker(blockers, activeCohorts === 0, {
    code: "no_active_cohort",
    message: "Create and activate an internal pilot cohort before expansion.",
    href: "/pilot",
  })
  addBlocker(blockers, !snapshot.launch.latestEvalMetadata.ragEnabled || !snapshot.launch.latestEvalMetadata.ragActivationEvalPassed, {
    code: "rag_not_active",
    message: "Product-doctrine RAG must be active through the activation gate before expansion.",
    href: "/sources/readiness",
  })
  const hasSourceSessions = snapshot.learning.reviewCoverage.sourceSessions > 0
  addBlocker(blockers, hasSourceSessions && snapshot.learning.reviewCoverage.coverageRate < 80, {
    code: "review_coverage_low",
    message: "Review at least 80% of source-grounded and no-source sessions before inviting more users.",
    count: snapshot.learning.reviewCoverage.coverageRate,
    href: "/pilot",
  })
  addBlocker(blockers, snapshot.learning.reviewCoverage.unreviewedSourceSessions > 0, {
    code: "unreviewed_source_sessions",
    message: "Review open source-grounded and no-source sessions before expansion.",
    count: snapshot.learning.reviewCoverage.unreviewedSourceSessions,
    href: "/pilot",
  })
  addBlocker(blockers, unresolvedNegativeFeedback > 0, {
    code: "unreviewed_negative_feedback",
    message: "Resolve negative or unclear feedback before expanding.",
    count: unresolvedNegativeFeedback,
    href: "/pilot",
  })
  addBlocker(blockers, unresolvedUnsupportedSourceFeedback > 0, {
    code: "unsupported_source_unreviewed",
    message: "Resolve unsupported-source reports before expanding.",
    count: unresolvedUnsupportedSourceFeedback,
    href: "/pilot",
  })
  addBlocker(blockers, snapshot.learning.reviewCoverage.pilotBlockers > 0 || snapshot.launch.metrics.qualityBlockers > 0, {
    code: "pilot_blockers_open",
    message: "Clear pilot-blocker quality reviews before expansion.",
    count: Math.max(snapshot.learning.reviewCoverage.pilotBlockers, snapshot.launch.metrics.qualityBlockers),
    href: "/council",
  })
  addBlocker(blockers, newUnresolvedSafetyItems > 0, {
    code: "new_safety_reviews_open",
    message: "Resolve new unreviewed or reviewing safety items before expansion.",
    count: newUnresolvedSafetyItems,
    href: "/safety",
  })

  if (snapshot.learning.feedbackMetrics.total === 0) {
    warnings.push("No feedback has been collected yet; expand only if this is intentional for a small internal batch.")
  }
  if (snapshot.launch.metrics.firstSessionsCompleted === 0) {
    warnings.push("No first sessions are complete yet; expansion should usually wait for at least one completed session.")
  }
  if (!hasSourceSessions) {
    warnings.push("No source-grounded or no-source RAG sessions are available for review coverage yet.")
  }

  return {
    passed: blockers.length === 0,
    checkedAt: snapshot.checkedAt.toISOString(),
    recommendedBatchSize: { min: 3, max: 5 },
    blockers,
    warnings,
    metrics: {
      activeCohorts,
      currentEnrolledUsers: snapshot.launch.metrics.enrolledUsers,
      completedFirstSessions: snapshot.launch.metrics.firstSessionsCompleted,
      reviewCoverageRate: snapshot.learning.reviewCoverage.coverageRate,
      unreviewedSourceSessions: snapshot.learning.reviewCoverage.unreviewedSourceSessions,
      unresolvedNegativeFeedback,
      unresolvedUnsupportedSourceFeedback,
      pilotBlockers: Math.max(snapshot.learning.reviewCoverage.pilotBlockers, snapshot.launch.metrics.qualityBlockers),
      newUnresolvedSafetyItems,
      ragEnabled: snapshot.launch.latestEvalMetadata.ragEnabled,
      ragActivationEvalPassed: snapshot.launch.latestEvalMetadata.ragActivationEvalPassed,
    },
    learningSummary: {
      ragSessions: snapshot.learning.sourceModeMetrics.rag ?? 0,
      noSourceSessions: snapshot.learning.sourceModeMetrics.no_eligible_source ?? 0,
      selectedTraceCount: snapshot.learning.sourceGroundingMetrics.selectedTraceCount,
      noEligibleSourceTraceCount: snapshot.learning.sourceGroundingMetrics.noEligibleSourceTraceCount,
      unsupportedSourceReports: snapshot.learning.feedbackMetrics.unsupportedSource,
    },
  }
}

export async function expandPilotCohort(input: {
  actorId: string
  pilotCohortId: string
  emails: string[]
  reason: string
  readiness?: PilotExpansionReadinessReport
}) {
  const uniqueEmails = Array.from(new Set(input.emails.map((email) => email.trim().toLowerCase()).filter(Boolean)))
  if (uniqueEmails.length < 3 || uniqueEmails.length > 5) {
    throw new Error("Pilot expansion requires 3 to 5 unique user emails.")
  }

  const readiness = input.readiness ?? await runPilotExpansionReadiness()
  if (!readiness.passed) {
    throw new Error(`Pilot expansion is blocked: ${readiness.blockers.map((blocker) => blocker.code).join(", ")}`)
  }

  const cohort = await prisma.pilotCohort.findFirst({
    where: { id: input.pilotCohortId, status: "active" },
    select: { id: true, name: true },
  })
  if (!cohort) throw new Error("Active pilot cohort not found.")

  const users = await prisma.user.findMany({
    where: { email: { in: uniqueEmails } },
    select: { id: true, email: true },
  })
  const usersByEmail = new Map(users.map((user) => [user.email.toLowerCase(), user]))
  const missing = uniqueEmails.filter((email) => !usersByEmail.has(email))
  if (missing.length > 0) {
    throw new Error(`Pilot users must register before expansion: ${missing.join(", ")}`)
  }

  const batchId = `pilot-expansion-${Date.now()}`
  const enrollments = []
  for (const email of uniqueEmails) {
    const user = usersByEmail.get(email)!
    const enrollment = await prisma.pilotEnrollment.upsert({
      where: {
        userId_pilotCohortId: {
          userId: user.id,
          pilotCohortId: cohort.id,
        },
      },
      create: {
        userId: user.id,
        pilotCohortId: cohort.id,
        status: "invited",
        metadata: { batchId, source: "admin_expansion_gate" },
      },
      update: {
        status: "active",
        removedAt: null,
        metadata: { batchId, source: "admin_expansion_gate" },
      },
    })
    enrollments.push({ id: enrollment.id, email })
  }

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "pilot_expansion.approve",
      targetType: "PilotCohort",
      targetId: cohort.id,
      reason: input.reason,
      metadata: {
        batchId,
        cohortName: cohort.name,
        emailHashes: uniqueEmails.map(hashEmailForAudit),
        batchSize: uniqueEmails.length,
        readiness: summarizeReadiness(readiness),
        enrollments: enrollments.map((enrollment) => ({
          id: enrollment.id,
          emailHash: hashEmailForAudit(enrollment.email),
        })),
      },
    },
  })

  for (const enrollment of enrollments) {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        action: "pilot_enrollment.expansion_upsert",
        targetType: "PilotEnrollment",
        targetId: enrollment.id,
        reason: input.reason,
        metadata: {
          batchId,
          pilotCohortId: cohort.id,
          userEmailHash: hashEmailForAudit(enrollment.email),
        },
      },
    })
  }

  return {
    batchId,
    cohortId: cohort.id,
    enrolled: enrollments,
    readiness,
  }
}

export function hashEmailForAudit(email: string) {
  return createHash("sha256").update(email.trim().toLowerCase()).digest("hex")
}

function summarizeReadiness(readiness: PilotExpansionReadinessReport) {
  return {
    passed: readiness.passed,
    checkedAt: readiness.checkedAt,
    blockers: readiness.blockers.map((blocker) => blocker.code),
    metrics: readiness.metrics,
    recommendedBatchSize: readiness.recommendedBatchSize,
  }
}

function addBlocker(blockers: PilotExpansionBlocker[], condition: boolean, blocker: PilotExpansionBlocker) {
  if (condition) blockers.push(blocker)
}
