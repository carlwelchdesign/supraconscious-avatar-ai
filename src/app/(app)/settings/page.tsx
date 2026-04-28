import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAppUser } from "@/lib/auth/user"

export default async function SettingsPage() {
  const user = await requireAppUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Settings</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Privacy, memory, billing, and safety controls belong here as the MVP expands.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Reflection Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-6">
          <p>Avatar tone: {user.avatarTone}</p>
          <p>Intensity: {user.intensityLevel}/5</p>
          <p>Pattern memory: {user.patternMemoryEnabled ? "On" : "Off"}</p>
          <p>Safety mode: {user.safetyModeEnabled ? "On" : "Off"}</p>
        </CardContent>
      </Card>
    </div>
  )
}
