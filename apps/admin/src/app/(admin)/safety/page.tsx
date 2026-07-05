import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { resolveSafetyEventAction } from "./actions"
import { RevealEntryForm } from "./reveal-entry-form"

const SAFETY_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  saved: { tone: "success", message: "Safety review saved." },
  invalid: { tone: "error", message: "Safety review needs a valid event, status, and reason." },
}

export default async function SafetyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? SAFETY_STATUS_MESSAGES[status] : null
  const events = await prisma.safetyEvent.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { email: true } },
      journalEntry: { select: { id: true, createdAt: true } },
    },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Safety Events</h1>
        <p className="mt-2 text-sm text-muted-foreground">Raw journal content is hidden by default. Reveals require a reason and create an audit log.</p>
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
      <div className="space-y-4">
        {events.map((event) => (
          <Card key={event.id}>
            <CardHeader>
              <CardTitle>{event.severity} severity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid gap-2 md:grid-cols-2">
                <p>User: {event.user.email}</p>
                <p>Created: {event.createdAt.toLocaleString()}</p>
                <p>Journal entry: {event.journalEntry?.id ?? "none"}</p>
                <p>Review: {event.reviewStatus}</p>
              </div>
              {event.reviewReason ? <p className="text-muted-foreground">Review note: {event.reviewReason}</p> : null}
              <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(event.flags, null, 2)}</pre>
              {event.recommendedAction ? <p className="text-muted-foreground">{event.recommendedAction}</p> : null}
              <form action={resolveSafetyEventAction} className="flex flex-wrap items-center gap-2 rounded-md border p-3">
                <input type="hidden" name="safetyEventId" value={event.id} />
                <select name="reviewStatus" defaultValue={event.reviewStatus === "escalated" ? "escalated" : "resolved"} className="rounded-md border bg-background px-2 py-1 text-xs">
                  <option value="resolved">resolved</option>
                  <option value="escalated">escalated</option>
                </select>
                <input name="reason" placeholder="Review reason required" className="min-w-64 rounded-md border bg-background px-2 py-1 text-xs" />
                <button className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                  Save review
                </button>
              </form>
              {event.journalEntry ? <RevealEntryForm safetyEventId={event.id} /> : null}
            </CardContent>
          </Card>
        ))}
        {!events.length ? <p className="text-sm text-muted-foreground">No safety events found.</p> : null}
      </div>
    </div>
  )
}
