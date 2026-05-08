import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"

export default async function AdminHomePage() {
  const [users, entries, subscriptions, safetyEvents] = await Promise.all([
    prisma.user.count(),
    prisma.journalEntry.count(),
    prisma.subscription.count(),
    prisma.safetyEvent.count(),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">Internal operations, safety, billing support, and prompt management.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Users" value={users} />
        <Metric title="Entries" value={entries} />
        <Metric title="Subscriptions" value={subscriptions} />
        <Metric title="Safety Events" value={safetyEvents} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Privacy Default</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          Admin list views show metadata first. Raw journal text is only available through explicit reveal flows that require a reason and write an audit log.
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/safety" className="underline">Review safety events</Link>
        <Link href="/prompts" className="underline">Manage prompt templates</Link>
        <Link href="/feature-flags" className="underline">Manage feature flags</Link>
      </div>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}
