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
      createdAt: true,
      journalEntryId: true,
      user: { select: { email: true } },
      messages: { select: { role: true, confidence: true, abstained: true } },
      synthesis: { select: { integratorQuestion: true } },
      generationTraces: {
        where: { traceType: { in: ["council", "synthesis"] } },
        orderBy: { createdAt: "desc" },
        take: 3,
        select: {
          id: true,
          traceType: true,
          model: true,
          promptVersion: true,
          validationStatus: true,
          fallbackReason: true,
          sourceChunkId: true,
        },
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
                    </div>
                  ))}
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium">Quality label</p>
                      <p className="text-xs text-muted-foreground">
                        Current: {session.generationTraces[0]?.validationStatus ?? "unreviewed"}
                      </p>
                    </div>
                    <form action={updateCouncilQualityLabelAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="councilSessionId" value={session.id} />
                      <select
                        name="validationStatus"
                        defaultValue={session.generationTraces[0]?.validationStatus ?? "unreviewed"}
                        className="rounded-md border bg-background px-2 py-1 text-xs"
                      >
                        {QUALITY_LABELS.map((label) => (
                          <option key={label.value} value={label.value}>{label.label}</option>
                        ))}
                      </select>
                      <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                        Save label
                      </button>
                    </form>
                  </div>
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {session.generationTraces.length === 0 ? (
                      <p>No trace records found for this session.</p>
                    ) : session.generationTraces.map((trace) => (
                      <p key={trace.id}>
                        {trace.traceType} · {trace.model ?? "local"} · {trace.promptVersion ?? "no prompt version"} · {trace.validationStatus}
                      </p>
                    ))}
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
