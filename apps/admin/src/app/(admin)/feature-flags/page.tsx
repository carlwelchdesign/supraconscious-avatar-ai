import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Input } from "@inner-avatar/ui/input"
import { prisma } from "@inner-avatar/db"
import { AdminStatusBanner } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
import { upsertFeatureFlagAction } from "./actions"

const FLAG_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  saved: { tone: "success", message: "Feature flag saved." },
  invalid: { tone: "error", message: "Feature flag needs a valid key and reason." },
  rag_blocked: { tone: "error", message: "RAG can only be enabled through the dedicated RAG readiness activation gate." },
}

export default async function FeatureFlagsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? FLAG_STATUS_MESSAGES[status] : null
  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feature Flags</h1>
      <AdminStatusBanner message={statusMessage} />
      <Card>
        <CardHeader>
          <CardTitle>Create or Update Flag</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertFeatureFlagAction} className="grid gap-3">
            <Input name="key" placeholder="feature.key" required />
            <Input name="description" placeholder="Description" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="enabled" />
              Enabled
            </label>
            <Input name="reason" placeholder="Reason required" required minLength={10} />
            <SubmitButton className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" pendingLabel="Saving flag...">
              Save flag
            </SubmitButton>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {flags.map((flag) => (
          <Card key={flag.id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
              <div>
                <p className="font-medium">{flag.key}</p>
                <p className="text-muted-foreground">{flag.description ?? "No description"}</p>
              </div>
              <p>{flag.enabled ? "enabled" : "disabled"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
