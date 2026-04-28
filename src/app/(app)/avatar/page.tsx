import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAppUser } from "@/lib/auth/user"

const stages = ["Echo", "Witness", "Clear Mirror", "Reframer", "Inner Author"]

export default async function AvatarPage() {
  const user = await requireAppUser()
  const currentStage = stages[user.avatarStage - 1] ?? "Echo"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Avatar</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          The Avatar adapts through evidence of reflection, not intensity.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{currentStage}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-6">
          <p>Current tone: {user.avatarTone}</p>
          <p>Reflection intensity: {user.intensityLevel}/5</p>
          <p className="text-muted-foreground">This stage reflects language first, then names patterns as they repeat.</p>
        </CardContent>
      </Card>
    </div>
  )
}
