import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"

export default async function HealthPage() {
  let database = "ok"
  try {
    await prisma.user.count()
  } catch {
    database = "error"
  }

  const checks = [
    { label: "Database", value: database },
    { label: "OpenAI API key", value: process.env.OPENAI_API_KEY ? "configured" : "missing" },
    { label: "Super admin allowlist", value: process.env.SUPER_ADMIN_EMAILS ? "configured" : "missing" },
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
      <AbuseAndUsagePressure />
    </div>
  )
}

async function AbuseAndUsagePressure() {
  const now = new Date()
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
  const [authBuckets, topAuthBuckets, voiceBuckets, topVoiceBuckets] = await Promise.all([
    prisma.authRateLimitBucket.aggregate({
      where: { windowStart: { gte: fifteenMinutesAgo } },
      _sum: { count: true },
      _count: { _all: true },
    }),
    prisma.authRateLimitBucket.findMany({
      where: { windowStart: { gte: fifteenMinutesAgo } },
      orderBy: { count: "desc" },
      take: 8,
      select: { scope: true, bucketKey: true, count: true, windowStart: true },
    }),
    prisma.voiceUsageBucket.aggregate({
      where: { windowStart: { gte: oneHourAgo } },
      _sum: { count: true },
      _count: { _all: true },
    }),
    prisma.voiceUsageBucket.findMany({
      where: { windowStart: { gte: oneHourAgo } },
      orderBy: { count: "desc" },
      take: 8,
      select: { scope: true, count: true, windowStart: true, user: { select: { email: true } } },
    }),
  ])

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Auth Abuse Pressure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Attempts in 15 min" value={authBuckets._sum.count ?? 0} />
            <Metric label="Active buckets" value={authBuckets._count._all} />
          </div>
          {topAuthBuckets.length ? (
            <div className="space-y-2">
              {topAuthBuckets.map((bucket) => (
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
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Voice Usage Pressure</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Requests in 1 hour" value={voiceBuckets._sum.count ?? 0} />
            <Metric label="Active buckets" value={voiceBuckets._count._all} />
          </div>
          {topVoiceBuckets.length ? (
            <div className="space-y-2">
              {topVoiceBuckets.map((bucket) => (
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
        </CardContent>
      </Card>
    </div>
  )
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
