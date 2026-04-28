import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export default async function AdminAnalyticsPage() {
  await requireAdminUser()
  const [users, entries, analyses, safetyEvents, patterns] = await Promise.all([
    prisma.user.count(),
    prisma.journalEntry.count(),
    prisma.entryAnalysis.count(),
    prisma.safetyEvent.count(),
    prisma.patternMemory.count(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">Analytics</h1>
      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Users" value={users} />
        <Metric title="Entries" value={entries} />
        <Metric title="Analyses" value={analyses} />
        <Metric title="Safety Events" value={safetyEvents} />
        <Metric title="Tracked Patterns" value={patterns} />
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
