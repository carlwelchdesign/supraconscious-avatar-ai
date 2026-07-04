import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { updateCouncilQualityLabelAction } from "./actions"

const QUALITY_LABELS = [
  { value: "unreviewed", label: "Unreviewed" },
  { value: "grounded", label: "Grounded" },
  { value: "too_vague", label: "Too vague" },
  { value: "too_intense", label: "Too intense" },
  { value: "unsupported", label: "Unsupported" },
  { value: "safety_concern", label: "Safety concern" },
]

export default async function CouncilReviewPage() {
  const sessions = await prisma.councilSession.findMany({
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
        select: { label: true, severity: true, reason: true, reviewedAt: true },
      },
      _count: { select: { generationTraces: true, embodimentGateResponses: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Council Review</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metadata-first review of Inner Council runs, role confidence, traces, and embodiment completion.
        </p>
      </div>

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
                  <span>{session.status}</span>
                  <span>source: {session.sourceMode}</span>
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
                    </div>
                    <form action={updateCouncilQualityLabelAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="councilSessionId" value={session.id} />
                      <select
                        name="validationStatus"
                        defaultValue={session.qualityReviews[0]?.label ?? "unreviewed"}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        {QUALITY_LABELS.map((label) => (
                          <option key={label.value} value={label.value}>{label.label}</option>
                        ))}
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
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      />
                      <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                        Save label
                      </button>
                    </form>
                  </div>
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
