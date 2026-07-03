import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { createPilotCohortAction, enrollPilotUserAction } from "./actions"

export default async function PilotReadinessPage() {
  const [
    cohorts,
    enrollmentCount,
    completedFirstSessions,
    embodimentSaved,
    feedback,
    safetyQueue,
    qualityBlockers,
    sourceModes,
    latestEval,
  ] = await Promise.all([
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
    prisma.pilotEnrollment.count({ where: { status: { in: ["invited", "active", "completed"] } } }),
    prisma.pilotEnrollment.count({ where: { completedFirstSessionAt: { not: null } } }),
    prisma.embodimentGateResponse.count(),
    prisma.councilSessionFeedback.groupBy({
      by: ["feedbackType"],
      _count: { feedbackType: true },
    }),
    prisma.safetyEvent.count({ where: { reviewStatus: { in: ["unreviewed", "reviewing"] } } }),
    prisma.qualityReview.count({ where: { severity: "pilot_blocker" } }),
    prisma.councilSession.groupBy({
      by: ["sourceMode"],
      _count: { sourceMode: true },
    }),
    prisma.featureFlag.findUnique({
      where: { key: "rag_enabled" },
      select: { metadata: true, updatedAt: true },
    }),
  ])
  const completionRate = enrollmentCount ? Math.round((completedFirstSessions / enrollmentCount) * 100) : 0

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Pilot Readiness</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cohort setup, first-session funnel, feedback, safety review, quality blockers, and source mode health.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Pilot users" value={enrollmentCount} />
        <Metric title="First sessions" value={`${completionRate}%`} />
        <Metric title="Gate saves" value={embodimentSaved} />
        <Metric title="Safety queue" value={safetyQueue} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Quality blockers</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{qualityBlockers}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Source modes</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {sourceModes.length ? sourceModes.map((mode) => (
              <p key={mode.sourceMode}>{mode.sourceMode}: {mode._count.sourceMode}</p>
            )) : <p className="text-muted-foreground">No sessions yet.</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Eval freshness</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {latestEval?.metadata ? `RAG gate updated ${latestEval.updatedAt.toLocaleString()}` : "No RAG activation eval metadata recorded."}
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
        <CardHeader><CardTitle>Cohorts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form action={createPilotCohortAction} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
            <input name="name" placeholder="Cohort name" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <input name="description" placeholder="Description" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Create cohort</button>
          </form>
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
