import { z } from "zod"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"
import { reserveVoiceUsage, voiceRateLimitMessage } from "@/lib/voice/rate-limit"
import { synthesizeSpeech } from "@/lib/voice/speak"

const SpeakSchema = z.object({
  text: z.string().min(1).max(4096),
  gender: z.enum(["female", "male"]).default("female"),
  style: z.enum(["warm", "neutral", "deep", "soft"]).default("warm"),
  speed: z.number().min(0.25).max(4.0).default(1.0),
})

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = SpeakSchema.parse(await request.json())

    const usage = await reserveVoiceUsage("voice_speak", user.id)
    if (!usage.allowed) {
      return privateJson({ error: voiceRateLimitMessage("voice_speak") }, { status: 429 })
    }

    const audio = await synthesizeSpeech(body.text, body.gender, body.style, body.speed)

    return new Response(new Uint8Array(audio), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audio.length),
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Speech synthesis failed.", status: 500 })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
