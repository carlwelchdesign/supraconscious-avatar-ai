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
    </div>
  )
}
