import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { readRagActivationMetadata, runPilotExpansionReadiness, runPilotIterationReport, runPilotLaunchReadiness, runPilotLearningReport, runPilotReviewCoverageReport } from "@inner-avatar/ai"
import { createPilotCohortAction, enrollPilotUserAction, expandPilotCohortAction, reviewPilotSessionAction } from "./actions"

const QUALITY_LABELS = [
  ["reviewed", "Reviewed"],
  ["grounded", "Grounded"],
  ["too_vague", "Too vague"],
  ["too_intense", "Too intense"],
  ["unsupported", "Unsupported"],
  ["safety_concern", "Safety concern"],
] as const

export default async function PilotReadinessPage() {
  const [readiness, iteration, learning, expansion, reviewCoverage] = await Promise.all([
    runPilotLaunchReadiness(),
    runPilotIterationReport(),
    runPilotLearningReport(),
    runPilotExpansionReadiness(),
    runPilotReviewCoverageReport(),
  ])
  const schemaReady = !readiness.blockers.some((blocker) => blocker.code === "database_schema_not_ready")
  const [cohorts, feedback, ragFlag, recentRetrievalTitles] = schemaReady ? await Promise.all([
    prisma.pilotCohort.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        enrollments: {
          include: { user: { select: { email: true, onboardingComplete: true } } },
          take: 20,
        },
      },
    }),
    prisma.councilSessionFeedback.groupBy({
      by: ["feedbackType"],
      _count: { feedbackType: true },
    }),
    prisma.featureFlag.findUnique({
      where: { key: "rag_enabled" },
      select: { enabled: true, metadata: true },
    }),
    prisma.generationTrace.findMany({
      where: { traceType: "retrieval", sourceChunkId: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        sourceChunk: {
          select: {
            sourceDocument: { select: { title: true } },
          },
        },
      },
    }),
  ]) : [[], [], null, []]
  const ragActivation = readRagActivationMetadata(ragFlag?.metadata)
  const orientationRate = readiness.metrics.enrolledUsers
    ? Math.round((readiness.metrics.orientationCompleteUsers / readiness.metrics.enrolledUsers) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pilot Readiness</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Daily pilot operations, launch readiness, feedback review, source readiness, eval status, and quality blockers.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Last checked {new Date(iteration.checkedAt).toLocaleString()}
        </p>
      </div>

      <Card className={readiness.passed ? "border-emerald-500/30" : "border-destructive/30"}>
        <CardHeader>
          <CardTitle>{readiness.passed ? "Launch checklist passed" : "Launch blockers"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {readiness.blockers.length > 0 ? (
            <div className="grid gap-2">
              {readiness.blockers.map((blocker) => (
                <div key={blocker.code} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
                  <div>
                    <p className="font-medium text-destructive">{blocker.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {blocker.code}{typeof blocker.count === "number" ? ` · ${blocker.count}` : ""}
                    </p>
                  </div>
                  {blocker.href && (
                    <Link href={blocker.href} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                      Review
                    </Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border bg-emerald-500/5 p-3 text-sm text-muted-foreground">
              No launch blockers found. Keep this as an internal pilot and continue daily review during active testing.
            </p>
          )}
          {readiness.warnings.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              {readiness.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Pilot users" value={readiness.metrics.enrolledUsers} />
        <Metric title="Orientation" value={`${orientationRate}%`} />
        <Metric title="First sessions" value={`${iteration.cohortMetrics.firstSessionCompletionRate}%`} />
        <Metric title="Gate saves" value={`${iteration.cohortMetrics.gateSaveRate}%`} />
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Metric title="Helpful" value={iteration.feedbackMetrics.helpful} />
        <Metric title="Not accurate" value={iteration.feedbackMetrics.notAccurate} />
        <Metric title="Too intense" value={iteration.feedbackMetrics.tooIntense} />
        <Metric title="Unclear" value={iteration.feedbackMetrics.unclear} />
        <Metric title="Source reports" value={iteration.feedbackMetrics.unsupportedSource} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="RAG sessions" value={learning.sourceModeMetrics.rag ?? 0} />
        <Metric title="No-source sessions" value={learning.sourceModeMetrics.no_eligible_source ?? 0} />
        <Metric title="Review coverage" value={`${learning.reviewCoverage.coverageRate}%`} />
        <Metric title="Unreviewed source" value={learning.reviewCoverage.unreviewedSourceSessions} />
      </div>

      <Card className={expansion.passed ? "border-emerald-500/30" : "border-destructive/30"}>
        <CardHeader><CardTitle>{expansion.passed ? "Expansion gate passed" : "Expansion blocked"}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <SmallMetric title="Recommended batch" value={`${expansion.recommendedBatchSize.min}-${expansion.recommendedBatchSize.max}`} />
            <SmallMetric title="Current pilot users" value={expansion.metrics.currentEnrolledUsers} />
            <SmallMetric title="Completed first sessions" value={expansion.metrics.completedFirstSessions} />
            <SmallMetric title="Review coverage" value={`${expansion.metrics.reviewCoverageRate}%`} />
          </div>
          {expansion.blockers.length > 0 ? (
            <div className="grid gap-2">
              {expansion.blockers.map((blocker) => (
                <div key={blocker.code} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
                  <div>
                    <p className="font-medium text-destructive">{blocker.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {blocker.code}{typeof blocker.count === "number" ? ` · ${blocker.count}` : ""}
                    </p>
                  </div>
                  {blocker.href && (
                    <Link href={blocker.href} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Review</Link>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-md border bg-emerald-500/5 p-3 text-sm text-muted-foreground">
              Expansion is eligible for a 3-5 user internal batch. Keep this internal and review the next batch before inviting more users.
            </p>
          )}
          {expansion.warnings.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              {expansion.warnings.map((warning) => <p key={warning}>{warning}</p>)}
            </div>
          )}
          {reviewCoverage.recommendations.length > 0 && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              {reviewCoverage.recommendations.map((recommendation) => <p key={recommendation}>{recommendation}</p>)}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Gated Pilot Expansion</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Enroll 3-5 existing registered internal users only after the expansion gate passes. This writes audit logs and stores metadata only.
          </p>
          <form action={expandPilotCohortAction} className="grid gap-3 md:grid-cols-[1fr_2fr]">
            <select name="pilotCohortId" className="rounded-md border bg-background px-3 py-2 text-sm">
              {cohorts.map((cohort) => (
                <option key={cohort.id} value={cohort.id}>{cohort.name}</option>
              ))}
            </select>
            <textarea
              name="emails"
              placeholder="3-5 registered user emails, one per line or comma separated"
              className="min-h-24 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="reason"
              placeholder="Expansion reason required"
              className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-2"
            />
            <button disabled={!expansion.passed || cohorts.length === 0} className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
              Expand internal pilot
            </button>
          </form>
        </CardContent>
      </Card>

      {iteration.recommendations.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Daily Recommendations</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            {iteration.recommendations.map((recommendation) => <p key={recommendation}>{recommendation}</p>)}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Review Coverage To Expand</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 md:grid-cols-4">
            <SmallMetric title="Reviewed" value={reviewCoverage.coverage.reviewedSourceSessions} />
            <SmallMetric title="Source/no-source total" value={reviewCoverage.coverage.sourceSessions} />
            <SmallMetric title="Needed for 80%" value={reviewCoverage.coverage.requiredReviewedForExpansion} />
            <SmallMetric title="Reviews remaining" value={reviewCoverage.coverage.additionalReviewsNeededFor80Percent} />
          </div>
          <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
            Raw journal text is hidden in this workflow. Review source-grounded and no-source sessions with an explicit disposition to improve coverage.
          </p>
          {reviewCoverage.blockers.length > 0 && (
            <div className="grid gap-2">
              {reviewCoverage.blockers.map((blocker) => (
                <div key={blocker.code} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 p-3 text-sm">
                  <div>
                    <p className="font-medium text-destructive">{blocker.message}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {blocker.code}{typeof blocker.count === "number" ? ` · ${blocker.count}` : ""}
                    </p>
                  </div>
                  {blocker.href && (
                    <Link href={blocker.href} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Review</Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Review queues</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Safety queue: {readiness.metrics.unresolvedSafetyReviews}</p>
            <p>Quality blockers: {readiness.metrics.qualityBlockers}</p>
            <p>Feedback records: {readiness.metrics.feedbackTotal}</p>
            <p>Feedback needing review: {iteration.feedbackMetrics.needsReview}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Source modes</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {Object.keys(readiness.metrics.sourceModeCounts).length ? Object.entries(readiness.metrics.sourceModeCounts).map(([mode, count]) => (
              <p key={mode}>{mode}: {count}</p>
            )) : <p className="text-muted-foreground">No sessions yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Feature flags</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Council mode: {readiness.latestEvalMetadata.councilModeEnabled ? "enabled" : "disabled"}</p>
            <p>RAG: {readiness.latestEvalMetadata.ragEnabled ? "enabled" : "disabled"}</p>
            <p>RAG activation eval: {ragActivation.evalPassed ? "passed" : "not approved"}</p>
            <p>ChatGPT app: legacy analysis-only for this pilot.</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Source readiness</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>Product doctrine chunks: {readiness.sourceReadiness.productDoctrineEligibleChunks}</p>
            <p>Month {readiness.sourceReadiness.checkedMonth} curriculum days: {readiness.sourceReadiness.currentMonthApprovedCurriculumDays}</p>
            <p>Curriculum chunks: {readiness.sourceReadiness.currentMonthEligibleCurriculumChunks}</p>
            <p>Manuscript eligible chunks: {readiness.sourceReadiness.manuscriptEligibleChunks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Eval status</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm text-muted-foreground">
            <p>RAG eval: {readiness.latestEvalMetadata.rag.passed ? "passed" : "failed"} ({readiness.latestEvalMetadata.rag.failed}/{readiness.latestEvalMetadata.rag.total} failed)</p>
            <p>Pilot eval: {readiness.latestEvalMetadata.pilot.passed ? "passed" : "failed"} ({readiness.latestEvalMetadata.pilot.failed}/{readiness.latestEvalMetadata.pilot.total} failed)</p>
            <p>RAG activation metadata: {readiness.latestEvalMetadata.ragActivationEvalPassed ? "present" : "not approved"}</p>
            <p>Rollback criteria: {ragActivation.rollbackCriteria ?? "not recorded"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Internal RAG Monitoring</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Retrieval traces: {readiness.metrics.sourceModeCounts.rag ?? 0} source-grounded sessions · {readiness.metrics.sourceModeCounts.no_eligible_source ?? 0} no-source sessions.</p>
          <p>Unsupported-source reports: {iteration.feedbackMetrics.unsupportedSource}</p>
          <p>Selected retrieval traces: {learning.sourceGroundingMetrics.selectedTraceCount} · paraphrase-only selections: {learning.sourceGroundingMetrics.paraphraseOnlySelections} · quote excerpts shown: {learning.sourceGroundingMetrics.displayExcerptCount}</p>
          <p>Activation: {ragFlag?.enabled ? "enabled" : "disabled"}{ragActivation.activatedAt ? ` · ${new Date(ragActivation.activatedAt).toLocaleString()}` : ""}</p>
          <div>
            <p className="font-medium text-foreground">Recent selected source titles</p>
            {recentRetrievalTitles.length ? (
              <div className="mt-1 space-y-1">
                {Array.from(new Set(recentRetrievalTitles.map((item) => item.sourceChunk?.sourceDocument.title).filter(Boolean))).map((title) => (
                  <p key={title}>{title}</p>
                ))}
              </div>
            ) : (
              <p>No selected retrieval sources yet.</p>
            )}
          </div>
          <Link href="/sources/readiness" className="inline-flex rounded-md border px-3 py-2 text-xs font-medium text-foreground hover:bg-muted">
            Open RAG readiness and rollback
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>RAG Learning Queue</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {reviewCoverage.prioritizedQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source-grounding review items are open.</p>
          ) : reviewCoverage.prioritizedQueue.map((item) => (
            <div key={item.councilSessionId} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-medium">{item.userEmail} · {new Date(item.createdAt).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    priority: {item.priority} · source: {item.sourceMode} · disposition: {item.disposition} · validation: {item.validationStatus ?? "unknown"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    feedback: {item.feedbackTypes.length ? item.feedbackTypes.join(", ") : "none"} · review: {item.latestReviewLabel ?? "unreviewed"}{item.latestReviewSeverity === "pilot_blocker" ? " · pilot blocker" : ""}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    raw journal text hidden: {item.rawJournalTextHidden ? "yes" : "no"}{item.latestReviewReason ? ` · reason: ${item.latestReviewReason}` : ""}
                  </p>
                </div>
                <Link href={item.reviewHref} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  Council review
                </Link>
              </div>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Sources</p>
                  {item.selectedSourceTitles.length ? item.selectedSourceTitles.map((title) => <p key={title}>{title}</p>) : <p>No selected source.</p>}
                  {item.selectedChunkIds.length > 0 && <p className="mt-1">chunks: {item.selectedChunkIds.join(", ")}</p>}
                  {item.displayExcerptSuppressed && <p className="mt-1">Display excerpts suppressed by paraphrase-only rights.</p>}
                </div>
                <div className="rounded-md bg-muted/40 p-2 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Grounding</p>
                  {item.matchReasons.length ? item.matchReasons.map((reason) => <p key={reason}>{reason}</p>) : <p>{item.fallbackReason ?? "No match reason recorded."}</p>}
                  <p className="mt-1">citation coverage: {item.citationCoverage ?? "unknown"} · evidence coverage: {item.evidenceCoverage ?? "unknown"}</p>
                  {item.validationWarnings.length > 0 && <p className="mt-1">warnings: {item.validationWarnings.join(", ")}</p>}
                  {item.validationFailedRules.length > 0 && <p className="mt-1">failed rules: {item.validationFailedRules.join(", ")}</p>}
                </div>
              </div>
              <form action={reviewPilotSessionAction} className="mt-3 grid gap-2 md:grid-cols-[auto_auto_auto_1fr_auto]">
                <input type="hidden" name="councilSessionId" value={item.councilSessionId} />
                <select name="label" defaultValue={item.latestReviewLabel ?? "grounded"} className="rounded-md border bg-background px-2 py-2 text-xs">
                  {QUALITY_LABELS.filter(([value]) => value !== "reviewed").map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select name="disposition" defaultValue={item.disposition === "needs_review" ? "reviewed" : item.disposition} className="rounded-md border bg-background px-2 py-2 text-xs">
                  <option value="reviewed">reviewed</option>
                  <option value="cleared">cleared</option>
                  <option value="blocked">blocked</option>
                </select>
                <select name="severity" defaultValue={item.latestReviewSeverity ?? "normal"} className="rounded-md border bg-background px-2 py-2 text-xs">
                  <option value="normal">normal</option>
                  <option value="pilot_blocker">pilot blocker</option>
                </select>
                <input name="reason" placeholder="Reason required; no raw journal text" className="rounded-md border bg-background px-3 py-2 text-xs" />
                <button className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">Save review</button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Feedback Mix</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {feedback.length ? feedback.map((item) => (
            <p key={item.feedbackType}>{item.feedbackType}: {item._count.feedbackType}</p>
          )) : <p className="text-muted-foreground">No session feedback yet.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Feedback Review Queue</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {iteration.qualityQueue.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback-driven review items are open.</p>
          ) : iteration.qualityQueue.map((item) => (
            <div key={item.councilSessionId} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{item.userEmail} · {new Date(item.createdAt).toLocaleString()}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    feedback: {item.feedbackTypes.join(", ")} · disposition: {item.disposition} · source: {item.sourceMode}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    latest review: {item.latestReviewLabel ?? "none"}{item.latestReviewSeverity === "pilot_blocker" ? " · pilot blocker" : ""}
                  </p>
                </div>
                <Link href="/council" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                  Review details
                </Link>
              </div>
              <form action={reviewPilotSessionAction} className="mt-3 grid gap-2 md:grid-cols-[auto_auto_auto_1fr_auto]">
                <input type="hidden" name="councilSessionId" value={item.councilSessionId} />
                <select name="label" defaultValue={item.latestReviewLabel ?? "reviewed"} className="rounded-md border bg-background px-2 py-2 text-xs">
                  {QUALITY_LABELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <select name="disposition" defaultValue={item.disposition === "needs_review" ? "reviewed" : item.disposition} className="rounded-md border bg-background px-2 py-2 text-xs">
                  <option value="reviewed">reviewed</option>
                  <option value="cleared">cleared</option>
                  <option value="blocked">blocked</option>
                </select>
                <select name="severity" defaultValue={item.latestReviewSeverity ?? "normal"} className="rounded-md border bg-background px-2 py-2 text-xs">
                  <option value="normal">normal</option>
                  <option value="pilot_blocker">pilot blocker</option>
                </select>
                <input name="reason" placeholder="Reason required; no raw journal text" className="rounded-md border bg-background px-3 py-2 text-xs" />
                <button className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">Save review</button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Safety Escalations</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {iteration.safetyQueue.length === 0 ? (
            <p className="text-muted-foreground">No active safety items in the pilot queue.</p>
          ) : iteration.safetyQueue.map((item) => (
            <div key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3">
              <p>{item.severity} · {item.reviewStatus} · {new Date(item.createdAt).toLocaleString()}</p>
              <Link href="/safety" className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Safety review</Link>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Operator Links</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2 text-sm">
          <Link href="/safety" className="rounded-md border px-3 py-2 hover:bg-muted">Safety review</Link>
          <Link href="/council" className="rounded-md border px-3 py-2 hover:bg-muted">Council review</Link>
          <Link href="/sources" className="rounded-md border px-3 py-2 hover:bg-muted">Source review</Link>
          <Link href="/sources/readiness" className="rounded-md border px-3 py-2 hover:bg-muted">RAG readiness</Link>
          <Link href="/feature-flags" className="rounded-md border px-3 py-2 hover:bg-muted">Feature flags</Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cohorts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action={createPilotCohortAction} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <input name="name" placeholder="Cohort name" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <input name="description" placeholder="Description" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <button disabled={!schemaReady} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">Create cohort</button>
          </form>
          {!schemaReady && (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              Apply the latest migrations before creating cohorts or enrollments.
            </p>
          )}
          {cohorts.map((cohort) => (
            <div key={cohort.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{cohort.name}</p>
                <p className="text-xs text-muted-foreground">{cohort.status} · {cohort.enrollments.length} shown</p>
              </div>
              <form action={enrollPilotUserAction} className="mt-3 flex flex-wrap gap-2">
                <input type="hidden" name="pilotCohortId" value={cohort.id} />
                <input name="email" placeholder="User email" className="rounded-md border bg-background px-3 py-2 text-sm" />
                <input name="reason" placeholder="Setup reason" className="rounded-md border bg-background px-3 py-2 text-sm" />
                <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Enroll user</button>
              </form>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                {cohort.enrollments.map((enrollment) => (
                  <p key={enrollment.id}>{enrollment.user.email} · {enrollment.status} · onboarding {enrollment.user.onboardingComplete ? "complete" : "pending"}</p>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}

function SmallMetric({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
