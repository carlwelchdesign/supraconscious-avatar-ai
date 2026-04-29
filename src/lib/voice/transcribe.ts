import { openai } from "@/lib/ai/openai"

export async function transcribeAudio(audio: Blob): Promise<string> {
  const file = new File([audio], "recording.webm", { type: audio.type || "audio/webm" })
  const response = await openai.audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
  })
  return response.text
}
