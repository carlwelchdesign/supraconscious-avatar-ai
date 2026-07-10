import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { prisma } from "@inner-avatar/db"
import { AdminStatusBanner } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
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
      <AdminStatusBanner message={statusMessage} />
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
            <SubmitButton className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" pendingLabel="Saving stage...">
              Save stage
            </SubmitButton>
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
