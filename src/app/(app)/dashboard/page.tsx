import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

export default async function DashboardPage() {
  const user = await requireAppUser()
  const [entryCount, patternCount, latestEntry] = await Promise.all([
    prisma.journalEntry.count({ where: { userId: user.id } }),
    prisma.patternMemory.count({ where: { userId: user.id, active: true } }),
    prisma.journalEntry.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: { avatarResponse: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Your current reflective level is Awareness.</p>
        </div>
        <Button asChild>
          <Link href="/journal">New Entry</Link>
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Entries</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{entryCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Patterns</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">{patternCount}</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avatar Stage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm leading-6">Echo. Reflecting your language back with care.</CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Reflection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-6 text-muted-foreground">
          {latestEntry?.avatarResponse?.mirror ?? "No reflections yet. Start with one entry."}
        </CardContent>
      </Card>
    </div>
  )
}
