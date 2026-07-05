import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { runFounderCalibrationSetupReport } from "@inner-avatar/ai"

export default async function HealthPage() {
  let database = "ok"
  try {
    await prisma.user.count()
  } catch {
    database = "error"
  }

  const founderSetup = await runFounderCalibrationSetupReport()
  const authEmailConfigured = Boolean(process.env.RESEND_API_KEY && process.env.AUTH_EMAIL_FROM)
  const turnstileConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY)
  const stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY &&
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_STARTER_PRICE_ID &&
      process.env.STRIPE_PRO_PRICE_ID &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  )
  const handoffUrlsConfigured = Boolean(process.env.INNER_AVATAR_WEB_URL && process.env.NEXT_PUBLIC_ADMIN_URL)

  const checks = [
    { label: "Database", value: database },
    { label: "OpenAI API key", value: process.env.OPENAI_API_KEY ? "configured" : "missing" },
    { label: "Super admin allowlist", value: process.env.SUPER_ADMIN_EMAILS ? "configured" : "missing" },
    { label: "Auth email delivery", value: authEmailConfigured ? "configured" : "manual/admin fallback" },
    { label: "Turnstile bot protection", value: turnstileConfigured ? "configured" : "disabled" },
    { label: "Billing configuration", value: stripeConfigured ? "configured" : "disabled/incomplete" },
    { label: "Founder handoff URLs", value: handoffUrlsConfigured ? "configured" : "using defaults" },
    { label: "Founder calibration setup", value: founderSetup.readiness.ready ? "ready" : `${founderSetup.missingActions.length} action${founderSetup.missingActions.length === 1 ? "" : "s"} remaining` },
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
        authEmailConfigured={authEmailConfigured}
        turnstileConfigured={turnstileConfigured}
        stripeConfigured={stripeConfigured}
        handoffUrlsConfigured={handoffUrlsConfigured}
        founderMissingActions={founderSetup.missingActions.map((action) => action.message)}
      />
      <AbuseAndUsagePressure />
    </div>
  )
}

function RuntimeConfigurationNotes({
  authEmailConfigured,
  turnstileConfigured,
  stripeConfigured,
  handoffUrlsConfigured,
  founderMissingActions,
}: {
  authEmailConfigured: boolean
  turnstileConfigured: boolean
  stripeConfigured: boolean
  handoffUrlsConfigured: boolean
  founderMissingActions: string[]
}) {
  const notes = [
    authEmailConfigured ? null : "Auth email delivery is not configured; verification and reset links require manual/admin fallback.",
    turnstileConfigured ? null : "Turnstile is disabled; server-side auth rate limits still apply.",
    stripeConfigured ? null : "Billing is disabled or incomplete; keep paid plans hidden until Stripe env vars are configured.",
    handoffUrlsConfigured ? null : "Founder handoff links are using default local URLs; set production web/admin origins before sending launch packets.",
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
