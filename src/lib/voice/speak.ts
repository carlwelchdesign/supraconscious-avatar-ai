import { openai } from "@/lib/ai/openai"
import { resolveVoice, VoiceGender, VoiceStyle } from "./voice-config"

export async function synthesizeSpeech(
  text: string,
  gender: VoiceGender = "female",
  style: VoiceStyle = "warm",
  speed: number = 1.0,
): Promise<Buffer> {
  const voice = resolveVoice(gender, style)
  const response = await openai.audio.speech.create({
    model: "tts-1",
    voice: voice as Parameters<typeof openai.audio.speech.create>[0]["voice"],
    input: text,
    speed: Math.min(4.0, Math.max(0.25, speed)),
  })
  return Buffer.from(await response.arrayBuffer())
}
