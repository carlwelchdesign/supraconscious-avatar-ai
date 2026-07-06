import Link from "next/link"
import { formatFounderCalibrationScenario, isFounderCalibrationFeedbackNoteUseful, resolveFounderCalibrationUserFilter, runFounderCalibrationComparison, runFounderCalibrationSetupReport } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { formatAdminDateTime } from "@/lib/date-format"
import { readFounderCalibrationReviewPriority } from "@/lib/founder-calibration-review-priority"
import { reviewCalibrationSessionAction } from "../actions"

const QUICK_LABELS = [
  ["ready", "Ready"],
  ["voice_wrong", "Voice wrong"],
  ["source_unsupported", "Source unsupported"],
  ["too_generic", "Too generic"],
  ["too_intense", "Too intense"],
  ["embodiment_weak", "Embodiment weak"],
  ["prompt_regression", "Prompt regression"],
] as const

const LIVE_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  review_saved: { tone: "success", message: "Founder calibration review saved." },
  review_invalid: { tone: "error", message: "Calibration review needs a valid session, label, and reason." },
  review_missing: { tone: "error", message: "That founder calibration session is no longer available." },
}

export default async function LiveCalibrationPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? LIVE_STATUS_MESSAGES[status] : null
  const webAppBaseUrl = readWebAppBaseUrl()
  const [comparison, setup, founderFilter] = await Promise.all([
    runFounderCalibrationComparison(),
    runFounderCalibrationSetupReport(),
    resolveFounderCalibrationUserFilter(),
  ])
  const sessions = await prisma.councilSession.findMany({
    where: { user: founderFilter.where },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      sourceMode: true,
      createdAt: true,
      observerSignal: true,
      user: { select: { email: true } },
      feedback: {
        orderBy: { createdAt: "desc" },
        select: { feedbackType: true, note: true, createdAt: true },
      },
      synthesis: { select: { integratorQuestion: true, integrationStep: true } },
      qualityReviews: {
        orderBy: { reviewedAt: "desc" },
        take: 1,
        select: { label: true, severity: true, reason: true, metadata: true },
      },
      generationTraces: {
        where: { traceType: "council" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { promptVersion: true, outputJson: true, validationStatus: true },
      },
    },
  })
  const prioritizedSessions = sessions
    .map((session) => {
      const trace = session.generationTraces[0]
      const latestReview = session.qualityReviews[0]
      const feedbackTypes = session.feedback.map((feedback) => feedback.feedbackType)
      const validationIssues = readPilotValidation(trace?.outputJson)
      return {
        session,
        reviewPriority: readFounderCalibrationReviewPriority({
          feedbackTypes,
          latestReviewLabel: latestReview?.label ?? null,
          latestReviewSeverity: latestReview?.severity ?? null,
          validationStatus: trace?.validationStatus ?? null,
          validationIssues,
        }),
      }
    })
    .sort((a, b) => a.reviewPriority.rank - b.reviewPriority.rank || b.session.createdAt.getTime() - a.session.createdAt.getTime())

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-wrap gap-2">
          <Link href="/calibration" className="text-xs text-muted-foreground hover:text-foreground">Back to calibration</Link>
          <Link href="/calibration/setup" className="text-xs text-muted-foreground hover:text-foreground">Founder setup</Link>
        </div>
        <h1 className="mt-2 text-2xl font-semibold">Live Founder Calibration</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Carl/Maria live review cockpit. Raw journal text is hidden; use scenario, council output, notes, prompt version, and source mode.
        </p>
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

      <Card>
        <CardHeader><CardTitle>Setup Readiness</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          {setup.missingActions.length === 0 ? (
            <p className="rounded-md border bg-emerald-500/5 p-3 text-muted-foreground">Founder setup is ready for live calibration.</p>
          ) : setup.missingActions.map((action) => (
            <p key={`${action.code}-${action.email ?? "global"}`} className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
              {action.href ? <InlineSafeLink href={action.href} label={action.message} webAppBaseUrl={webAppBaseUrl} email={action.email} /> : action.message}
            </p>
          ))}
          {setup.warnings.map((warning) => (
            <p key={warning} className="text-xs text-muted-foreground">{warning}</p>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Golden examples" value={comparison.goldenExamples.length} />
        <Metric title="Source / prompt issues" value={comparison.unresolvedIssues.length} />
        <Metric title="Prompt versions" value={comparison.promptVersions.length} />
      </div>

      <Card>
        <CardHeader><CardTitle>Scenario Coverage</CardTitle></CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          {comparison.scenarioCoverage.length === 0 ? (
            <p className="text-muted-foreground">No founder calibration sessions yet.</p>
          ) : comparison.scenarioCoverage.map((item) => (
            <div key={item.scenario} className="rounded-md border p-3">
              <p className="font-medium">{formatFounderCalibrationScenario(item.scenario)}</p>
              <p className="text-xs text-muted-foreground">
                {item.totalSessions} total · {item.reviewedSessions} reviewed · {item.goldenExamples} ready · {item.unresolvedIssues} issues
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Sessions</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No Carl/Maria sessions yet.</p>
          ) : prioritizedSessions.map(({ session, reviewPriority }) => {
            const trace = session.generationTraces[0]
            const scenario = readScenario(trace?.outputJson)
            const promptVersion = trace?.promptVersion ?? "missing"
            const latestReview = session.qualityReviews[0]
            const feedbackTypes = session.feedback.map((feedback) => feedback.feedbackType)
            const hasFeedbackNote = session.feedback.some((feedback) => isFounderCalibrationFeedbackNoteUseful(feedback.note))
            const nextAction = chooseNextAction(latestReview?.label ?? null, feedbackTypes)
            const observer = session.observerSignal as { coreTension?: string } | null

            return (
              <div key={session.id} className="rounded-md border p-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{session.user.email} · {formatAdminDateTime(session.createdAt)}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      scenario: {formatFounderCalibrationScenario(scenario)} · source: {session.sourceMode} · prompt: {promptVersion}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      feedback: {feedbackTypes.join(", ") || "none"} · note: {hasFeedbackNote ? "yes" : "no"} · review: {latestReview?.label ?? "unreviewed"}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <span className="rounded-md border px-3 py-1.5 text-xs font-medium text-muted-foreground">
                      {reviewPriority.label}
                    </span>
                    <Link href={`/council?sessionId=${session.id}`} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">Workbench</Link>
                    {nextAction.href ? (
                      <Link href={nextAction.href} className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">{nextAction.label}</Link>
                    ) : null}
                  </div>
                </div>
                <p className="mt-3 rounded-md border bg-muted/30 p-2 text-xs text-muted-foreground">
                  Review priority: {reviewPriority.reason}
                </p>

                <div className="mt-3 rounded-md bg-muted/40 p-3">
                  <p className="font-medium">Council signal</p>
                  <p className="mt-1 text-xs text-muted-foreground">{observer?.coreTension ?? "No observer summary."}</p>
                  {session.synthesis?.integratorQuestion ? (
                    <p className="mt-2">{session.synthesis.integratorQuestion}</p>
                  ) : null}
                </div>

                <div className="mt-3 rounded-md border p-3">
                  <p className="font-medium">Feedback notes</p>
                  {session.feedback.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">No feedback yet.</p>
                  ) : session.feedback.map((feedback) => (
                    <p key={`${feedback.feedbackType}-${feedback.createdAt.toISOString()}`} className="mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{feedback.feedbackType}:</span>{" "}
                      {feedback.note?.trim() || "No note provided."}
                      {feedback.note?.trim() && !isFounderCalibrationFeedbackNoteUseful(feedback.note) ? (
                        <span className="ml-2 text-destructive">Needs more detail</span>
                      ) : null}
                    </p>
                  ))}
                </div>

                <form action={reviewCalibrationSessionAction} className="mt-3 grid gap-2 md:grid-cols-[auto_auto_1fr_1fr_1fr_auto]">
                  <input type="hidden" name="councilSessionId" value={session.id} />
                  <input type="hidden" name="returnTo" value="calibration_live" />
                  <select name="label" defaultValue="ready" className="rounded-md border bg-background px-2 py-2 text-xs">
                    {QUICK_LABELS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                  <select name="severity" defaultValue="normal" className="rounded-md border bg-background px-2 py-2 text-xs">
                    <option value="normal">normal</option>
                    <option value="pilot_blocker">pilot blocker</option>
                  </select>
                  <input name="relatedPromptVersion" defaultValue={promptVersion === "missing" ? "" : promptVersion} placeholder="Prompt version" className="rounded-md border bg-background px-3 py-2 text-xs" />
                  <input name="relatedGoldenExampleId" placeholder="Related golden example id" className="rounded-md border bg-background px-3 py-2 text-xs" />
                  <input name="reason" placeholder="Review reason required; no raw journal text" required minLength={10} className="rounded-md border bg-background px-3 py-2 text-xs" />
                  <button className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">Save</button>
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

function readScenario(outputJson: unknown) {
  if (!outputJson || typeof outputJson !== "object" || !("calibration" in outputJson)) return "freeform"
  const calibration = (outputJson as { calibration?: unknown }).calibration
  if (!calibration || typeof calibration !== "object" || !("scenario" in calibration)) return "freeform"
  const value = (calibration as { scenario?: unknown }).scenario
  return typeof value === "string" ? value : "freeform"
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

function chooseNextAction(label: string | null, feedbackTypes: string[]) {
  if (label === "voice_wrong" || label === "too_generic" || label === "too_intense" || label === "prompt_regression") return { label: "Prompts", href: "/prompts" }
  if (label === "source_unsupported" || feedbackTypes.includes("unsupported_source")) return { label: "Sources", href: "/sources" }
  return { label: "Review", href: null }
}

const FOUNDER_WEB_PATHS = new Set(["/register", "/login", "/onboarding", "/journal"])
const PROTECTED_FOUNDER_WEB_PATHS = new Set(["/onboarding", "/journal"])

function readWebAppBaseUrl() {
  return (process.env.INNER_AVATAR_WEB_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/+$/, "")
}

function resolveFounderHref(href: string, webAppBaseUrl: string, email?: string | null) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  if (isFounderWebPath(href)) {
    if (email && isProtectedFounderWebPath(href)) {
      return `${webAppBaseUrl}/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(href)}`
    }
    const suffix = email && (href === "/register" || href === "/login") ? `?email=${encodeURIComponent(email)}` : ""
    return `${webAppBaseUrl}${href}${suffix}`
  }
  return href
}

function isFounderWebPath(href: string) {
  return FOUNDER_WEB_PATHS.has(href) || href.startsWith("/journal/")
}

function isProtectedFounderWebPath(href: string) {
  return PROTECTED_FOUNDER_WEB_PATHS.has(href) || href.startsWith("/journal/")
}

function InlineSafeLink({ href, label, webAppBaseUrl, email }: { href: string; label: string; webAppBaseUrl: string; email?: string | null }) {
  return <Link href={resolveFounderHref(href, webAppBaseUrl, email)} className="underline">{label}</Link>
}
