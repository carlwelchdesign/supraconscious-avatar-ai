export type VoiceGender = "female" | "male"
export type VoiceStyle = "warm" | "neutral" | "deep" | "soft"

// Maps gender + style to OpenAI TTS voice names
const VOICE_MAP: Record<VoiceGender, Record<VoiceStyle, string>> = {
  female: { warm: "nova", neutral: "shimmer", deep: "sage", soft: "alloy" },
  male:   { warm: "fable", neutral: "onyx", deep: "onyx", soft: "echo" },
}

export function resolveVoice(gender: VoiceGender, style: VoiceStyle): string {
  return VOICE_MAP[gender]?.[style] ?? "nova"
}

export type AvatarResponseFields = {
  openingLine?: string | null
  mirror?: string | null
  socraticQuestion?: string | null
  integrationStep?: string | null
  closingLine?: string | null
}

export function buildSpeakText(response: AvatarResponseFields): string {
  return [
    response.openingLine,
    response.mirror,
    response.socraticQuestion,
    response.integrationStep,
    response.closingLine,
  ]
    .filter(Boolean)
    .join(" ")
    .trim()
    .slice(0, 4096)
}
