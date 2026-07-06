import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Button } from "@inner-avatar/ui/button"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { prisma } from "@inner-avatar/db"
import { upsertAvatarStageAction } from "../avatar-stages/actions"

const STAGE_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  saved: { tone: "success", message: "Guide stage saved." },
  invalid: { tone: "error", message: "Guide stage needs a stage number from 1 to 5, name, and reason." },
}

export default async function GuideStagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? STAGE_STATUS_MESSAGES[status] : null
  const stages = await prisma.avatarStageConfig.findMany({ orderBy: { stage: "asc" } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Guide Stages</h1>
      {statusMessage ? (
        <div
          className={[
            "rounded-md border p-3 text-sm",
            statusMessage.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "",
            statusMessage.tone === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "",
          ].filter(Boolean).join(" ")}
        >
          {statusMessage.message}
        </div>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Create or Update Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertAvatarStageAction} className="grid gap-3">
            <Input name="stage" type="number" min={1} max={5} placeholder="Stage number" required />
            <Input name="name" placeholder="Stage name" required />
            <Textarea name="description" placeholder="Description" />
            <Input name="reason" placeholder="Reason required" required minLength={10} />
            <Button type="submit">Save stage</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {stages.map((stage) => (
          <Card key={stage.id}>
            <CardContent className="p-4 text-sm">
              <p className="font-medium">Stage {stage.stage}: {stage.name}</p>
              <p className="mt-1 text-muted-foreground">{stage.description ?? "No description"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
