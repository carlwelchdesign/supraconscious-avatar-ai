import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { resolveFounderCalibrationUserFilter } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { batchReviewPilotSessionsAction, reviewPilotSessionFromCouncilAction } from "./actions"
import { reviewCalibrationSessionAction } from "../calibration/actions"

const QUALITY_LABELS = [
  { value: "grounded", label: "Grounded" },
  { value: "too_vague", label: "Too vague" },
  { value: "too_intense", label: "Too intense" },
  { value: "unsupported", label: "Unsupported" },
  { value: "safety_concern", label: "Safety concern" },
]

const FOUNDER_LABELS = [
  { value: "ready", label: "Ready / golden" },
  { value: "voice_wrong", label: "Voice wrong" },
  { value: "source_unsupported", label: "Source unsupported" },
  { value: "too_generic", label: "Too generic" },
  { value: "too_intense", label: "Too intense" },
  { value: "embodiment_weak", label: "Embodiment weak" },
  { value: "prompt_regression", label: "Prompt regression" },
]

const COUNCIL_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  review_saved: { tone: "success", message: "Council quality label saved." },
  review_invalid: { tone: "error", message: "Council review needs a valid session, label, disposition, and reason." },
  batch_saved: { tone: "success", message: "Selected council sessions were reviewed." },
  batch_invalid: { tone: "error", message: "Batch review needs at least one selected session, a label, disposition, and reason." },
  session_missing: { tone: "error", message: "One or more selected council sessions are no longer available." },
  review_missing: { tone: "error", message: "That founder calibration session is no longer available." },
}

type SearchParams = Promise<Record<string, string | string[] | undefined>>

export default async function CouncilReviewPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = searchParams ? await searchParams : {}
  const sessionId = firstParam(params.sessionId)
  const sourceMode = firstParam(params.sourceMode)
  const reviewStatus = firstParam(params.reviewStatus)
  const feedbackType = firstParam(params.feedbackType)
  const status = firstParam(params.status)
  const statusMessage = status ? COUNCIL_STATUS_MESSAGES[status] : null
  const founderFilter = await resolveFounderCalibrationUserFilter()
  const founderEmails = new Set(founderFilter.where.email.in ?? [])
  const where = {
    ...(sessionId ? { id: sessionId } : {}),
    ...(sourceMode && sourceMode !== "all" ? { sourceMode } : {}),
    ...(feedbackType && feedbackType !== "all" ? { feedback: { some: { feedbackType } } } : {}),
    ...(reviewStatus === "unreviewed" ? { qualityReviews: { none: {} } } : {}),
    ...(reviewStatus === "reviewed" ? { qualityReviews: { some: {} } } : {}),
    ...(reviewStatus === "pilot_blocker" ? { qualityReviews: { some: { severity: "pilot_blocker" } } } : {}),
  }
  const sessions = await prisma.councilSession.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      status: true,
      sourceMode: true,
      observerSignal: true,
      safetySnapshot: true,
      createdAt: true,
      journalEntryId: true,
      user: { select: { email: true } },
      feedback: { select: { feedbackType: true } },
      messages: { select: { role: true, displayName: true, content: true, confidence: true, abstained: true, sourceChunkIds: true } },
      synthesis: { select: { integratorQuestion: true, integrationStep: true, sourceChunkIds: true } },
      generationTraces: {
        where: { traceType: { in: ["council", "synthesis", "retrieval"] } },
        orderBy: { createdAt: "desc" },
        take: 8,
        select: {
          id: true,
          traceType: true,
          model: true,
          promptVersion: true,
          validationStatus: true,
          fallbackReason: true,
          sourceChunkId: true,
          outputJson: true,
          sourceChunk: {
            select: {
              sourceDocument: { select: { title: true } },
            },
          },
        },
      },
      qualityReviews: {
        orderBy: { reviewedAt: "desc" },
        take: 1,
        select: { label: true, severity: true, reason: true, metadata: true, reviewedAt: true },
      },
      _count: { select: { generationTraces: true, embodimentGateResponses: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Council Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metadata-first review of Inner Council runs, role confidence, traces, and embodiment completion. Raw journal text remains hidden here.
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
        <CardHeader><CardTitle>Review filters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-2 md:grid-cols-5">
            <input
              name="sessionId"
              defaultValue={sessionId ?? ""}
              placeholder="Session id"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <select name="sourceMode" defaultValue={sourceMode ?? "all"} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="all">All source modes</option>
              <option value="rag">RAG</option>
              <option value="no_eligible_source">No source</option>
              <option value="none">None</option>
              <option value="grounding">Grounding</option>
            </select>
            <select name="reviewStatus" defaultValue={reviewStatus ?? "all"} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="all">All review states</option>
              <option value="unreviewed">Unreviewed</option>
              <option value="reviewed">Reviewed</option>
              <option value="pilot_blocker">Pilot blockers</option>
            </select>
            <select name="feedbackType" defaultValue={feedbackType ?? "all"} className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="all">All feedback</option>
              <option value="helpful">Helpful</option>
              <option value="not_accurate">Not accurate</option>
              <option value="too_intense">Too intense</option>
              <option value="unclear">Unclear</option>
              <option value="unsupported_source">Unsupported source</option>
            </select>
            <button className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">Apply filters</button>
          </form>
          <form id="council-batch-review" action={batchReviewPilotSessionsAction} className="grid gap-2 rounded-md border p-3 md:grid-cols-[auto_auto_auto_1fr_auto]">
            <select name="validationStatus" defaultValue="grounded" className="rounded-md border bg-background px-2 py-2 text-xs">
              {QUALITY_LABELS.map((label) => <option key={label.value} value={label.value}>{label.label}</option>)}
            </select>
            <select name="disposition" defaultValue="reviewed" className="rounded-md border bg-background px-2 py-2 text-xs">
              <option value="reviewed">reviewed</option>
              <option value="cleared">cleared</option>
              <option value="blocked">blocked</option>
            </select>
            <select name="severity" defaultValue="normal" className="rounded-md border bg-background px-2 py-2 text-xs">
              <option value="normal">normal</option>
              <option value="pilot_blocker">pilot blocker</option>
            </select>
            <input name="reason" placeholder="Batch reason required; no raw journal text" required minLength={10} className="rounded-md border bg-background px-3 py-2 text-xs" />
            <button className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">Review selected</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No council sessions have been created yet.
            </CardContent>
          </Card>
        ) : sessions.map((session) => {
          const observer = session.observerSignal as { coreTension?: string; emotionalTone?: string }
          const safety = session.safetySnapshot as { severity?: string; flags?: string[] }
          return (
            <Card key={session.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {session.user.email} · {new Date(session.createdAt).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <label className="inline-flex items-center gap-1 text-foreground">
                    <input form="council-batch-review" type="checkbox" name="sessionIds" value={session.id} />
                    Select
                  </label>
                  <span>{session.status}</span>
                  <span>source: {session.sourceMode}</span>
                  <span>feedback: {session.feedback.map((item) => item.feedbackType).join(", ") || "none"}</span>
                  <span>{session._count.generationTraces} traces</span>
                  <span>{session._count.embodimentGateResponses} gate responses</span>
                  <span>safety: {safety.severity ?? "unknown"}</span>
                  <span>entry: {session.journalEntryId}</span>
                </div>
                <p className="text-muted-foreground">{observer.coreTension ?? "No observer summary"}</p>
                {session.synthesis?.integratorQuestion ? (
                  <p className="font-medium">{session.synthesis.integratorQuestion}</p>
                ) : null}
                <div className="grid gap-2 md:grid-cols-4">
                  {session.messages.map((message) => (
                    <div key={message.role} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{message.role}</p>
                      <p className="text-muted-foreground">
                        {message.abstained ? "abstained" : `${Math.round(message.confidence * 100)}% confidence`}
                      </p>
                      <p className="mt-2 line-clamp-4 text-muted-foreground">{message.content}</p>
                    </div>
                  ))}
                </div>
                {session.synthesis?.integrationStep ? (
                  <p className="rounded-md border p-3 text-xs text-muted-foreground">
                    Integration step: {session.synthesis.integrationStep}
                  </p>
                ) : null}
                <div className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium">Quality label</p>
                      <p className="text-xs text-muted-foreground">
                        Current: {session.qualityReviews[0]?.label ?? "unreviewed"}
                        {session.qualityReviews[0]?.severity === "pilot_blocker" ? " · pilot blocker" : ""}
                      </p>
                      {session.qualityReviews[0]?.reason ? (
                        <p className="mt-1 text-xs text-muted-foreground">Reason: {session.qualityReviews[0].reason}</p>
                      ) : null}
                    </div>
                    <form action={reviewPilotSessionFromCouncilAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="councilSessionId" value={session.id} />
                      <select
                        name="validationStatus"
                        defaultValue={session.qualityReviews[0]?.label ?? "grounded"}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        {QUALITY_LABELS.map((label) => (
                          <option key={label.value} value={label.value}>{label.label}</option>
                        ))}
                      </select>
                      <select
                        name="disposition"
                        defaultValue={readDisposition(session.qualityReviews[0]?.metadata) ?? "reviewed"}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        <option value="reviewed">reviewed</option>
                        <option value="cleared">cleared</option>
                        <option value="blocked">blocked</option>
                      </select>
                      <select
                        name="severity"
                        defaultValue={session.qualityReviews[0]?.severity ?? "normal"}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        <option value="normal">normal</option>
                        <option value="pilot_blocker">pilot blocker</option>
                      </select>
                      <input
                        name="reason"
                        placeholder="Reason required"
                        required
                        minLength={10}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      />
                      <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                        Save label
                      </button>
                    </form>
                  </div>
                  {founderEmails.has(session.user.email.toLowerCase()) && (
                    <form action={reviewCalibrationSessionAction} className="mt-3 grid gap-2 rounded-md border bg-muted/30 p-3 md:grid-cols-[auto_auto_1fr_auto]">
                      <input type="hidden" name="councilSessionId" value={session.id} />
                      <input type="hidden" name="returnTo" value="council" />
                      <select name="label" defaultValue="ready" className="rounded-md border bg-background px-2 py-1 text-xs">
                        {FOUNDER_LABELS.map((label) => (
                          <option key={label.value} value={label.value}>{label.label}</option>
                        ))}
                      </select>
                      <select name="severity" defaultValue="normal" className="rounded-md border bg-background px-2 py-1 text-xs">
                        <option value="normal">normal</option>
                        <option value="pilot_blocker">pilot blocker</option>
                      </select>
                      <input
                        name="reason"
                        placeholder="Founder calibration reason required"
                        required
                        minLength={10}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      />
                      <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                        Save founder review
                      </button>
                      <p className="text-xs text-muted-foreground md:col-span-4">
                        Use this for Carl/Maria calibration outcomes and golden examples. Raw journal text stays hidden.
                      </p>
                    </form>
                  )}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {session.generationTraces.length === 0 ? (
                      <p>No trace records found for this session.</p>
                    ) : session.generationTraces.map((trace) => {
                      const output = trace.outputJson as {
                        chunkId?: string
                        title?: string
                        rank?: number
                        matchReason?: string
                        matchedTerms?: string[]
                        matchedFields?: string[]
                        allowedUse?: string
                        displayExcerpt?: string | null
                        sourcePolicyVersion?: string
                        pilotValidation?: {
                          warnings?: string[]
                          failedRules?: string[]
                          citationCoverage?: number
                          evidenceCoverage?: number
                        }
                      } | null
                      const displayExcerptSuppressed = trace.traceType === "retrieval" &&
                        output?.allowedUse === "paraphrase_generation" &&
                        !output.displayExcerpt
                      return (
                        <div key={trace.id} className="rounded-md bg-muted/40 p-2">
                          <p>
                            {trace.traceType} · {output?.title ?? trace.sourceChunk?.sourceDocument.title ?? trace.model ?? "local"} · {trace.promptVersion ?? "no prompt version"} · {trace.validationStatus}
                          </p>
                          {trace.traceType === "retrieval" && (
                            <div className="mt-1 space-y-1">
                              <p>
                                rank {output?.rank ?? "none"} · chunk {output?.chunkId ?? trace.sourceChunkId ?? "none"} · {output?.matchReason ?? trace.fallbackReason ?? "no match reason"}
                              </p>
                              <p>
                                allowed use: {output?.allowedUse ?? "unknown"} · policy {output?.sourcePolicyVersion ?? "unknown"}
                              </p>
                              {displayExcerptSuppressed && (
                                <p>Display excerpt suppressed by paraphrase-only rights.</p>
                              )}
                            </div>
                          )}
                          {output?.matchedTerms && output.matchedTerms.length > 0 && (
                            <p className="mt-1">
                              terms: {output.matchedTerms.join(", ")} · fields: {(output.matchedFields ?? []).join(", ") || "none"}
                            </p>
                          )}
                          {output?.pilotValidation && (
                            <div className="mt-1 space-y-1">
                              <p>
                                citation coverage: {output.pilotValidation.citationCoverage ?? "unknown"} · evidence coverage: {output.pilotValidation.evidenceCoverage ?? "unknown"}
                              </p>
                              {output.pilotValidation.warnings && output.pilotValidation.warnings.length > 0 && (
                                <p>warnings: {output.pilotValidation.warnings.join(", ")}</p>
                              )}
                              {output.pilotValidation.failedRules && output.pilotValidation.failedRules.length > 0 && (
                                <p>failed rules: {output.pilotValidation.failedRules.join(", ")}</p>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function readDisposition(metadata: unknown) {
  if (metadata && typeof metadata === "object" && "feedbackDisposition" in metadata) {
    const value = (metadata as { feedbackDisposition?: unknown }).feedbackDisposition
    if (value === "reviewed" || value === "cleared" || value === "blocked") return value
  }
  return null
}
