import { getOpenAIClient } from "@inner-avatar/ai"

export async function transcribeAudio(audio: Blob): Promise<string> {
  const type = audio.type || "audio/webm"
  const file = new File([audio], `recording.${extensionForMimeType(type)}`, { type })
  const response = await getOpenAIClient().audio.transcriptions.create({
    file,
    model: "whisper-1",
    language: "en",
  })
  return response.text
}

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4"
  if (mimeType.includes("aac")) return "aac"
  if (mimeType.includes("mpeg")) return "mp3"
  if (mimeType.includes("ogg")) return "ogg"
  return "webm"
}
