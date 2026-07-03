import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { runPilotLaunchReadiness } from "@inner-avatar/ai"
import { createPilotCohortAction, enrollPilotUserAction } from "./actions"

export default async function PilotReadinessPage() {
  const readiness = await runPilotLaunchReadiness()
  const schemaReady = !readiness.blockers.some((blocker) => blocker.code === "database_schema_not_ready")
  const [cohorts, feedback] = schemaReady ? await Promise.all([
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
  ]) : [[], []]
  const completionRate = readiness.metrics.enrolledUsers
    ? Math.round((readiness.metrics.firstSessionsCompleted / readiness.metrics.enrolledUsers) * 100)
    : 0
  const orientationRate = readiness.metrics.enrolledUsers
    ? Math.round((readiness.metrics.orientationCompleteUsers / readiness.metrics.enrolledUsers) * 100)
    : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pilot Readiness</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Internal pilot launch checklist, cohort setup, source readiness, eval status, safety review, and quality blockers.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Last checked {new Date(readiness.checkedAt).toLocaleString()}
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
        <Metric title="First sessions" value={`${completionRate}%`} />
        <Metric title="Gate saves" value={readiness.metrics.embodimentGateSaves} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Review queues</CardTitle></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Safety queue: {readiness.metrics.unresolvedSafetyReviews}</p>
            <p>Quality blockers: {readiness.metrics.qualityBlockers}</p>
            <p>Feedback records: {readiness.metrics.feedbackTotal}</p>
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
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Feedback Mix</CardTitle></CardHeader>
        <CardContent className="space-y-1 text-sm">
          {feedback.length ? feedback.map((item) => (
            <p key={item.feedbackType}>{item.feedbackType}: {item._count.feedbackType}</p>
          )) : <p className="text-muted-foreground">No session feedback yet.</p>}
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
