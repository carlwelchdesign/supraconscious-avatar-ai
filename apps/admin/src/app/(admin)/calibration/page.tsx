import Link from "next/link"
import { isFounderCalibrationFeedbackNoteUseful, resolveFounderCalibrationUserFilter, runFounderCalibrationReport } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { formatAdminDateTime } from "@/lib/date-format"
import { reviewCalibrationSessionAction } from "./actions"

const LABELS = [
  ["voice_good", "Voice good"],
  ["voice_wrong", "Voice wrong"],
  ["source_good", "Source good"],
  ["source_unsupported", "Source unsupported"],
  ["too_generic", "Too generic"],
  ["too_intense", "Too intense"],
  ["embodiment_weak", "Embodiment weak"],
  ["prompt_regression", "Prompt regression"],
  ["ready", "Ready"],
] as const

const ISSUE_TYPES = [
  ["none", "No issue"],
  ["voice_mismatch", "Voice mismatch"],
  ["source_issue", "Source issue"],
  ["prompt_issue", "Prompt issue"],
  ["product_copy_issue", "Product copy issue"],
  ["embodiment_weak", "Embodiment weak"],
] as const

const CALIBRATION_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  review_saved: { tone: "success", message: "Founder calibration review saved." },
  review_invalid: { tone: "error", message: "Calibration review needs a valid session, label, and reason." },
  review_missing: { tone: "error", message: "That founder calibration session is no longer available." },
}

export default async function CalibrationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? CALIBRATION_STATUS_MESSAGES[status] : null
  const [report, founderFilter] = await Promise.all([
    runFounderCalibrationReport(),
    resolveFounderCalibrationUserFilter(),
  ])
  const sessions = await prisma.councilSession.findMany({
    where: { user: founderFilter.where },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      sourceMode: true,
      createdAt: true,
      observerSignal: true,
      user: { select: { email: true, name: true } },
      feedback: {
        orderBy: { createdAt: "desc" },
        select: { feedbackType: true, note: true, createdAt: true },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        select: { role: true, displayName: true, content: true, abstained: true },
      },
      synthesis: { select: { integratorQuestion: true, integrationStep: true } },
      qualityReviews: {
        orderBy: { reviewedAt: "desc" },
        take: 1,
        select: { label: true, severity: true, reason: true, metadata: true, reviewedAt: true },
      },
      generationTraces: {
        where: { traceType: { in: ["retrieval", "council"] } },
        orderBy: { createdAt: "desc" },
        take: 12,
        select: {
          traceType: true,
          validationStatus: true,
          sourceChunkId: true,
          outputJson: true,
          sourceChunk: { select: { sourceDocument: { select: { title: true } } } },
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Founder Calibration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Carl/Maria calibration review. Raw journal text is hidden; use feedback status, council output, and source traces to tune the experience.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href="/calibration/live" className="inline-flex rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">
            Open live calibration cockpit
          </Link>
          <Link href="/calibration/setup" className="inline-flex rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">
            Founder setup
          </Link>
        </div>
      </div>

      {statusMessage ? (
        <div
          className={[
            "rounded-md border p-3 text-sm",
            statusMessage.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "",
            statusMessage.tone === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "",
          ].filter(Boolean).join(" ")}
        >
          {statusMessage.message}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Sessions" value={report.sessionMetrics.totalSessions} />
        <Metric title="Feedback notes" value={report.sessionMetrics.feedbackNotes} />
        <Metric title="Reviewed" value={report.sessionMetrics.reviewedSessions} />
        <Metric title="Ready" value={report.sessionMetrics.readySessions} />
      </div>

      <Card>
        <CardHeader><CardTitle>Founder Participants</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          {report.users.length === 0 ? (
            <p className="text-muted-foreground">No linked Carl/Maria founder accounts are configured yet.</p>
          ) : report.users.map((user) => (
            <div key={user.id} className="rounded-md border p-3">
              <p className="font-medium">{user.name ?? user.email}</p>
              <p className="mt-1 text-xs text-muted-foreground">{user.email}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {user.sessionCount} session{user.sessionCount === 1 ? "" : "s"} · {user.feedbackCount} feedback item{user.feedbackCount === 1 ? "" : "s"}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="RAG" value={report.sessionMetrics.ragSessions} />
        <Metric title="No source" value={report.sessionMetrics.noSourceSessions} />
        <Metric title="Prompt issues" value={report.promptIssues.length} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Note coverage" value={`${Math.round(report.calibrationCoverage.noteCoverageRate * 100)}%`} />
        <Metric title="Review coverage" value={`${Math.round(report.calibrationCoverage.reviewCoverageRate * 100)}%`} />
        <Metric title="Golden examples" value={report.goldenExamples.length} />
        <Metric title="With feedback" value={report.calibrationCoverage.sessionsWithFeedback} />
      </div>

      <Card>
        <CardHeader><CardTitle>Calibration Status</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          {report.blockers.length > 0 ? (
            <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 text-destructive">
              {report.blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}
            </div>
          ) : (
            <p className="rounded-md border bg-emerald-500/5 p-3 text-muted-foreground">
              No calibration blockers found. Keep running guided Carl/Maria sessions; mark examples or issues only when they are useful.
            </p>
          )}
          {report.recommendations.map((recommendation) => (
            <p key={recommendation} className="text-muted-foreground">{recommendation}</p>
          ))}
          <p className="rounded-md border bg-muted/40 p-3 font-medium">
            Next action: {report.nextRecommendedAction}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Action Queues</CardTitle></CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2 xl:grid-cols-5">
          {report.actionQueues.map((queue) => (
            <div key={queue.key} className="rounded-md border p-3">
              <p className="font-medium">{queue.label}</p>
              <p className="mt-1 text-2xl font-semibold">{queue.count}</p>
              <p className="mt-2 text-xs text-muted-foreground">{queue.recommendedAction}</p>
              {(queue.key === "voice_fixes" || queue.key === "prompt_fixes") && (
                <Link href="/prompts" className="mt-3 inline-flex rounded border px-2 py-1 text-[10px] font-medium hover:bg-muted">
                  Tune council prompt
                </Link>
              )}
              {queue.sessionIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {queue.sessionIds.slice(0, 4).map((sessionId) => (
                    <Link key={sessionId} href={`/council?sessionId=${sessionId}`} className="rounded border px-2 py-1 text-[10px] hover:bg-muted">
                      {sessionId.slice(0, 6)}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Feedback Themes</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          {report.feedbackThemes.length === 0 ? (
            <p className="text-muted-foreground">No feedback themes yet.</p>
          ) : report.feedbackThemes.map((theme) => (
            <div key={theme.theme} className="rounded-md border p-3">
              <p className="font-medium">{theme.theme}</p>
              <p className="text-xs text-muted-foreground">{theme.count} session{theme.count === 1 ? "" : "s"}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Calibration Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Carl/Maria calibration sessions found.</p>
          ) : sessions.map((session) => {
            const observer = session.observerSignal as { coreTension?: string; contradiction?: string }
            const latestReview = session.qualityReviews[0]
            const sourceTraces = session.generationTraces.filter((trace) => trace.traceType === "retrieval" && trace.sourceChunkId)
            const councilTrace = session.generationTraces.find((trace) => trace.traceType === "council")
            const validation = readPilotValidation(councilTrace?.outputJson)
            return (
              <div key={session.id} className="rounded-md border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{session.user.email} · {formatAdminDateTime(session.createdAt)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      source: {session.sourceMode} · review: {latestReview?.label ?? "unreviewed"}{latestReview?.severity === "pilot_blocker" ? " · pilot blocker" : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">session: {session.id}</p>
                  </div>
                  <Link href={`/council?sessionId=${session.id}`} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    Council workbench
                  </Link>
                </div>

                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="font-medium">Council output</p>
                    <p className="mt-1 text-xs text-muted-foreground">{observer.coreTension ?? "No observer summary"}</p>
                    {session.synthesis?.integratorQuestion && (
                      <p className="mt-2 text-sm">{session.synthesis.integratorQuestion}</p>
                    )}
                    <div className="mt-3 space-y-2">
                      {session.messages.slice(0, 4).map((message) => (
                        <p key={message.role} className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{message.displayName}:</span> {message.abstained ? "abstained" : message.content}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md bg-muted/40 p-3">
                    <p className="font-medium">Source grounding</p>
                    {sourceTraces.length === 0 ? (
                      <p className="mt-1 text-xs text-muted-foreground">No selected source chunks.</p>
                    ) : sourceTraces.map((trace) => {
                      const output = trace.outputJson as { title?: string; matchReason?: string; chunkId?: string } | null
                      return (
                        <p key={`${trace.sourceChunkId}-${output?.matchReason}`} className="mt-1 text-xs text-muted-foreground">
                          {output?.title ?? trace.sourceChunk?.sourceDocument.title ?? "Approved source"} · {output?.chunkId ?? trace.sourceChunkId}
                        </p>
                      )
                    })}
                    {validation.length > 0 && (
                      <p className="mt-3 text-xs text-muted-foreground">validation: {validation.join(", ")}</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 rounded-md border p-3">
                  <p className="font-medium">Feedback status</p>
                  {session.feedback.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">No feedback yet.</p>
                  ) : session.feedback.map((feedback) => (
                    <p key={`${feedback.feedbackType}-${feedback.createdAt.toISOString()}`} className="mt-1 text-xs text-muted-foreground">
                      {feedback.feedbackType}{formatFeedbackNoteStatus(feedback.note)}
                    </p>
                  ))}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Open the live cockpit when the exact note text is needed for Carl/Maria calibration review.
                  </p>
                  {latestReview?.reason && (
                    <p className="mt-2 text-xs text-muted-foreground">latest review reason: {latestReview.reason}</p>
                  )}
                </div>

                <div className="mt-3 rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review decision</p>
                  <div className="mt-2 grid gap-2 md:grid-cols-4">
                    <PresetReviewButton
                      sessionId={session.id}
                      label="ready"
                      issueType="none"
                      buttonText="Ready / golden"
                      reason="Use as golden example for Carl and Maria calibration."
                      tone="ready"
                    />
                    <PresetReviewButton
                      sessionId={session.id}
                      label="voice_wrong"
                      issueType="voice_mismatch"
                      buttonText="Needs voice fix"
                      reason="Voice needs tuning for Carl and Maria calibration."
                    />
                    <PresetReviewButton
                      sessionId={session.id}
                      label="source_unsupported"
                      issueType="source_issue"
                      buttonText="Needs source fix"
                      reason="Source grounding needs review for Carl and Maria calibration."
                    />
                    <PresetReviewButton
                      sessionId={session.id}
                      label="embodiment_weak"
                      issueType="embodiment_weak"
                      buttonText="Needs embodiment fix"
                      reason="Embodiment guidance needs refinement for Carl and Maria calibration."
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <Link href="/prompts" className="rounded border px-2 py-1 font-medium hover:bg-background">
                      Tune prompts
                    </Link>
                    <Link href="/sources" className="rounded border px-2 py-1 font-medium hover:bg-background">
                      Review sources
                    </Link>
                    <Link href={`/council?sessionId=${session.id}`} className="rounded border px-2 py-1 font-medium hover:bg-background">
                      Open workbench
                    </Link>
                  </div>
                </div>

                <form action={reviewCalibrationSessionAction} className="mt-3 grid gap-2 md:grid-cols-[auto_auto_auto_1fr_auto]">
                  <input type="hidden" name="councilSessionId" value={session.id} />
                  <input type="hidden" name="returnTo" value="calibration" />
                  <select name="label" defaultValue="ready" className="rounded-md border bg-background px-2 py-2 text-xs">
                    {LABELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select name="calibrationIssueType" defaultValue="none" className="rounded-md border bg-background px-2 py-2 text-xs">
                    {ISSUE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select name="severity" defaultValue="normal" className="rounded-md border bg-background px-2 py-2 text-xs">
                    <option value="normal">normal</option>
                    <option value="pilot_blocker">pilot blocker</option>
                  </select>
                  <input name="reason" placeholder="Calibration reason required; no raw journal text" required minLength={10} className="rounded-md border bg-background px-3 py-2 text-xs" />
                  <button className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">Save review</button>
                </form>
              </div>
            )
          })}
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

function PresetReviewButton({
  sessionId,
  label,
  issueType,
  buttonText,
  reason,
  tone = "neutral",
}: {
  sessionId: string
  label: (typeof LABELS)[number][0]
  issueType: (typeof ISSUE_TYPES)[number][0]
  buttonText: string
  reason: string
  tone?: "neutral" | "ready"
}) {
  return (
    <form action={reviewCalibrationSessionAction}>
      <input type="hidden" name="councilSessionId" value={sessionId} />
      <input type="hidden" name="returnTo" value="calibration" />
      <input type="hidden" name="label" value={label} />
      <input type="hidden" name="calibrationIssueType" value={issueType} />
      <input type="hidden" name="severity" value="normal" />
      <input type="hidden" name="reason" value={reason} />
      <button
        className={
          tone === "ready"
            ? "w-full rounded-md border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-500/10"
            : "w-full rounded-md border px-3 py-2 text-xs font-medium hover:bg-background"
        }
      >
        {buttonText}
      </button>
    </form>
  )
}

function readPilotValidation(value: unknown) {
  if (!value || typeof value !== "object" || !("pilotValidation" in value)) return []
  const validation = (value as { pilotValidation?: unknown }).pilotValidation
  if (!validation || typeof validation !== "object") return []
  const record = validation as { warnings?: unknown; failedRules?: unknown }
  const warnings = Array.isArray(record.warnings) ? record.warnings.filter((item): item is string => typeof item === "string") : []
  const failedRules = Array.isArray(record.failedRules) ? record.failedRules.filter((item): item is string => typeof item === "string") : []
  return [...warnings, ...failedRules]
}

function formatFeedbackNoteStatus(note?: string | null) {
  if (isFounderCalibrationFeedbackNoteUseful(note)) return " · specific note saved"
  if (note?.trim()) return " · note saved"
  return " · no note"
}
