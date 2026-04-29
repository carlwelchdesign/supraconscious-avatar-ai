import { requireAppUser } from "@/lib/auth/user"
import { JournalWorkspace } from "@/components/journal/journal-workspace"

export default async function JournalPage() {
  const user = await requireAppUser()
  return (
    <JournalWorkspace
      avatarStage={(user.avatarStage ?? 1) as 1 | 2 | 3 | 4 | 5}
      voicePrefs={{
        voiceEnabled: user.voiceEnabled ?? false,
        voiceAutoPlay: user.voiceAutoPlay ?? false,
        voiceGender: user.voiceGender ?? "female",
        voiceStyle: user.voiceStyle ?? "warm",
        voiceSpeed: user.voiceSpeed ?? 1.0,
      }}
    />
  )
}
