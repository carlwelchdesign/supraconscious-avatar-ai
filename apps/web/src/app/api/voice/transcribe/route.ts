import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { reserveVoiceUsage, voiceRateLimitMessage } from "@/lib/voice/rate-limit"
import { transcribeAudio } from "@/lib/voice/transcribe"
import { privateJson } from "@/lib/private-json"

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const formData = await request.formData()
    const audio = formData.get("audio") as Blob | null

    if (!audio || audio.size === 0) {
      return privateJson({ error: "No audio received." }, { status: 400 })
    }
    if (audio.size > 25 * 1024 * 1024) {
      return privateJson({ error: "Audio too large (max 25 MB)." }, { status: 400 })
    }
    const usage = await reserveVoiceUsage("voice_transcribe", user.id)
    if (!usage.allowed) {
      return privateJson({ error: voiceRateLimitMessage("voice_transcribe") }, { status: 429 })
    }

    const text = await transcribeAudio(audio)
    if (!text.trim()) {
      return privateJson({ error: "No speech detected." }, { status: 422 })
    }

    return privateJson({ text })
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Transcription failed.", status: 500 })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
