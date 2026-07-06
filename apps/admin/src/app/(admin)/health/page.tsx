import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { runFounderCalibrationSetupReport } from "@inner-avatar/ai"
import { evaluateRuntimeReadiness } from "@/lib/runtime-readiness"

export default async function HealthPage() {
  let database = "ok"
  try {
    await prisma.user.count()
  } catch {
    database = "error"
  }

  const founderSetup = await readFounderSetupHealth()
  const runtime = evaluateRuntimeReadiness(process.env)

  const checks = [
    { label: "Database", value: database },
    { label: "Database URL", value: runtime.databaseConfigured ? `configured · SSL ${runtime.databaseSslMode}` : "missing" },
    { label: "Auth secret", value: runtime.authSecretConfigured ? "configured" : "missing" },
    { label: "OpenAI API key", value: runtime.openAiConfigured ? "configured" : "missing" },
    { label: "Super admin allowlist", value: runtime.superAdminConfigured ? "configured" : "missing" },
    { label: "Auth email delivery", value: runtime.authEmailConfigured ? "configured" : "manual/admin fallback" },
    { label: "Turnstile bot protection", value: runtime.turnstileMode },
    { label: "Billing configuration", value: runtime.stripeConfigured ? "configured" : "disabled/incomplete" },
    { label: "Founder handoff URLs", value: runtime.handoffUrlsConfigured ? "configured" : "using defaults" },
    {
      label: "Founder calibration setup",
      value: founderSetup.status === "unavailable"
        ? "unavailable"
        : founderSetup.report.readiness.ready
          ? "ready"
          : `${founderSetup.report.missingActions.length} action${founderSetup.report.missingActions.length === 1 ? "" : "s"} remaining`,
    },
    { label: "Environment", value: process.env.NODE_ENV ?? "unknown" },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">System Health</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {checks.map((check) => (
          <Card key={check.label}>
            <CardHeader>
              <CardTitle>{check.label}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{check.value}</CardContent>
          </Card>
        ))}
      </div>
      <RuntimeConfigurationNotes
        runtime={runtime}
        founderMissingActions={founderSetup.status === "ok" ? founderSetup.report.missingActions.map((action) => action.message) : []}
        founderUnavailable={founderSetup.status === "unavailable"}
      />
      <AbuseAndUsagePressure />
    </div>
  )
}

function RuntimeConfigurationNotes({
  runtime,
  founderMissingActions,
  founderUnavailable,
}: {
  runtime: ReturnType<typeof evaluateRuntimeReadiness>
  founderMissingActions: string[]
  founderUnavailable: boolean
}) {
  const notes = [
    ...runtime.productionBlockers,
    ...runtime.notes,
    founderUnavailable ? "Founder calibration setup could not be read. Check database migrations and runtime configuration." : null,
    ...founderMissingActions.slice(0, 4),
  ].filter(Boolean)

  if (notes.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        {notes.map((note) => (
          <p key={note}>{note}</p>
        ))}
        {founderMissingActions.length > 4 ? <p>{founderMissingActions.length - 4} more founder action{founderMissingActions.length - 4 === 1 ? "" : "s"} remain in calibration setup.</p> : null}
      </CardContent>
    </Card>
  )
}

async function readFounderSetupHealth() {
  try {
    return { status: "ok" as const, report: await runFounderCalibrationSetupReport() }
  } catch {
    return { status: "unavailable" as const }
  }
}

async function AbuseAndUsagePressure() {
  const now = new Date()
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const [authPressure, voicePressure] = await Promise.all([
    readAuthPressure(fifteenMinutesAgo),
    readVoicePressure(oneHourAgo),
  ])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Auth Abuse Pressure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {authPressure.status === "unavailable" ? (
            <p>Auth throttle data is unavailable. Run Prisma generate/migrate and restart the app if this is unexpected.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Attempts in 15 min" value={authPressure.buckets._sum.count ?? 0} />
                <Metric label="Active buckets" value={authPressure.buckets._count._all} />
              </div>
              {authPressure.topBuckets.length ? (
                <div className="space-y-2">
                  {authPressure.topBuckets.map((bucket) => (
                    <div key={`${bucket.scope}:${bucket.bucketKey}:${bucket.windowStart.toISOString()}`} className="rounded-md border p-3">
                      <p className="font-medium text-foreground">{bucket.scope} · {bucket.count}</p>
                      <p className="mt-1 break-all text-xs">{redactAuthBucketKey(bucket.bucketKey)}</p>
                      <p className="mt-1 text-xs">Window {formatDate(bucket.windowStart)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recent auth throttle activity.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Voice Usage Pressure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {voicePressure.status === "unavailable" ? (
            <p>Voice usage data is unavailable. Run Prisma generate/migrate and restart the app if this is unexpected.</p>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Requests in 1 hour" value={voicePressure.buckets._sum.count ?? 0} />
                <Metric label="Active buckets" value={voicePressure.buckets._count._all} />
              </div>
              {voicePressure.topBuckets.length ? (
                <div className="space-y-2">
                  {voicePressure.topBuckets.map((bucket) => (
                    <div key={`${bucket.scope}:${bucket.user?.email ?? "unknown"}:${bucket.windowStart.toISOString()}`} className="rounded-md border p-3">
                      <p className="font-medium text-foreground">{bucket.scope} · {bucket.count}</p>
                      <p className="mt-1 text-xs">{bucket.user?.email ?? "unknown user"}</p>
                      <p className="mt-1 text-xs">Window {formatDate(bucket.windowStart)}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No recent voice usage.</p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

async function readAuthPressure(windowStart: Date) {
  try {
    const [buckets, topBuckets] = await Promise.all([
      prisma.authRateLimitBucket.aggregate({
        where: { windowStart: { gte: windowStart } },
        _sum: { count: true },
        _count: { _all: true },
      }),
      prisma.authRateLimitBucket.findMany({
        where: { windowStart: { gte: windowStart } },
        orderBy: { count: "desc" },
        take: 8,
        select: { scope: true, bucketKey: true, count: true, windowStart: true },
      }),
    ])

    return { status: "ok" as const, buckets, topBuckets }
  } catch {
    return { status: "unavailable" as const }
  }
}

async function readVoicePressure(windowStart: Date) {
  try {
    const [buckets, topBuckets] = await Promise.all([
      prisma.voiceUsageBucket.aggregate({
        where: { windowStart: { gte: windowStart } },
        _sum: { count: true },
        _count: { _all: true },
      }),
      prisma.voiceUsageBucket.findMany({
        where: { windowStart: { gte: windowStart } },
        orderBy: { count: "desc" },
        take: 8,
        select: { scope: true, count: true, windowStart: true, user: { select: { email: true } } },
      }),
    ])

    return { status: "ok" as const, buckets, topBuckets }
  } catch {
    return { status: "unavailable" as const }
  }
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function redactAuthBucketKey(bucketKey: string) {
  if (bucketKey.includes(":email_hash:")) {
    const [prefix, hash] = bucketKey.split(":email_hash:")
    return `${prefix}:email_hash:${redactHash(hash ?? "")}`
  }
  if (bucketKey.includes(":email:")) {
    const [prefix, email] = bucketKey.split(":email:")
    return `${prefix}:email:${redactEmail(email ?? "")}`
  }
  if (bucketKey.includes(":ip:")) {
    const [prefix, ip] = bucketKey.split(":ip:")
    return `${prefix}:ip:${redactIp(ip ?? "")}`
  }
  return bucketKey
}

function redactHash(hash: string) {
  return hash.length > 12 ? `${hash.slice(0, 12)}...` : "redacted"
}

function redactEmail(email: string) {
  const [name, domain] = email.split("@")
  if (!name || !domain) return "redacted"
  return `${name.slice(0, 2)}***@${domain}`
}

function redactIp(ip: string) {
  if (ip === "unknown") return ip
  if (ip.includes(":")) return `${ip.slice(0, 6)}...`
  return ip.split(".").map((part, index) => (index < 2 ? part : "***")).join(".")
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date)
}
