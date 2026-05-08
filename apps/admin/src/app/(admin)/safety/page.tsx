import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { RevealEntryForm } from "./reveal-entry-form"

export default async function SafetyPage() {
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
                <p>Resolved: {event.resolved ? "yes" : "no"}</p>
              </div>
              <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">{JSON.stringify(event.flags, null, 2)}</pre>
              {event.recommendedAction ? <p className="text-muted-foreground">{event.recommendedAction}</p> : null}
              {event.journalEntry ? <RevealEntryForm safetyEventId={event.id} /> : null}
            </CardContent>
          </Card>
        ))}
        {!events.length ? <p className="text-sm text-muted-foreground">No safety events found.</p> : null}
      </div>
    </div>
  )
}
