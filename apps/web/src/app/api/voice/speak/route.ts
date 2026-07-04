import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAppUser } from "@inner-avatar/auth/session"
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
    const user = await requireAppUser()
    const body = SpeakSchema.parse(await request.json())

    const usage = await reserveVoiceUsage("voice_speak", user.id)
    if (!usage.allowed) {
      return NextResponse.json({ error: voiceRateLimitMessage("voice_speak") }, { status: 429 })
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
    const message = error instanceof Error ? error.message : "Speech synthesis failed."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 })
  }
}
