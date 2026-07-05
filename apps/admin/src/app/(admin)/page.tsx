import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { runFounderCalibrationSetupReport } from "@inner-avatar/ai"

export default async function AdminHomePage() {
  const [users, entries, subscriptions, safetyEvents, founderSetup] = await Promise.all([
    prisma.user.count(),
    prisma.journalEntry.count(),
    prisma.subscription.count(),
    prisma.safetyEvent.count(),
    runFounderCalibrationSetupReport(),
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
      <Card>
        <CardHeader>
          <CardTitle>Founder Calibration Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {founderSetup.readiness.ready ? (
            <p className="rounded-md border bg-emerald-500/5 p-3 text-muted-foreground">
              Carl and Maria have enough first-session evidence to keep calibrating. Continue reviewing sessions before making prompt or source changes.
            </p>
          ) : (
            <div className="rounded-md border bg-muted/40 p-3 text-muted-foreground">
              <p className="font-medium text-foreground">{founderSetup.missingActions.length} founder calibration action{founderSetup.missingActions.length === 1 ? "" : "s"} remaining.</p>
              <div className="mt-2 space-y-1">
                {founderSetup.missingActions.slice(0, 4).map((action) => (
                  <p key={`${action.code}-${action.email ?? "global"}`}>{action.message}</p>
                ))}
                {founderSetup.missingActions.length > 4 ? (
                  <p>{founderSetup.missingActions.length - 4} more action{founderSetup.missingActions.length - 4 === 1 ? "" : "s"} in setup.</p>
                ) : null}
              </div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <Link href="/calibration/setup" className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">
              Setup and handoff packet
            </Link>
            <Link href="/calibration/live" className="rounded-md border px-3 py-2 text-xs font-medium hover:bg-muted">
              Live review
            </Link>
          </div>
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/safety" className="underline">Review safety events</Link>
        <Link href="/prompts" className="underline">Manage prompt templates</Link>
        <Link href="/calibration" className="underline">Founder calibration</Link>
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
