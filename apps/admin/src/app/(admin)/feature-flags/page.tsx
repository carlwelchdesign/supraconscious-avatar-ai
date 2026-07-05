import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Button } from "@inner-avatar/ui/button"
import { Input } from "@inner-avatar/ui/input"
import { prisma } from "@inner-avatar/db"
import { upsertFeatureFlagAction } from "./actions"

export default async function FeatureFlagsPage() {
  const flags = await prisma.featureFlag.findMany({ orderBy: { key: "asc" } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Feature Flags</h1>
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
            <Input name="reason" placeholder="Reason required" required />
            <Button type="submit">Save flag</Button>
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
