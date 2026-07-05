import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Button } from "@inner-avatar/ui/button"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { prisma } from "@inner-avatar/db"
import { upsertAvatarStageAction } from "./actions"

export default async function AvatarStagesPage() {
  const stages = await prisma.avatarStageConfig.findMany({ orderBy: { stage: "asc" } })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Guide Stages</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create or Update Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertAvatarStageAction} className="grid gap-3">
            <Input name="stage" type="number" min={1} max={5} placeholder="Stage number" required />
            <Input name="name" placeholder="Stage name" required />
            <Textarea name="description" placeholder="Description" />
            <Input name="reason" placeholder="Reason required" required />
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
