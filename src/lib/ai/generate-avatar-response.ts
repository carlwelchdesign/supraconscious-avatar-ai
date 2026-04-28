import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_STAGES, AVATAR_SYSTEM_PROMPT, LEVELS } from "@/lib/ai/avatar-system-prompt"
import { isOpenAIConfigured, openai, reflectiveModel } from "@/lib/ai/openai"
import {
  AvatarResponseSchema,
  type AvatarResponse,
  type EntryAnalysis,
  type SafetyCheck,
} from "@/lib/ai/schemas"

type AvatarOptions = {
  tone: string
  intensity: number
  currentLevel: number
  avatarStage: number
}

export async function generateAvatarResponse(
  text: string,
  analysis: EntryAnalysis,
  safety: SafetyCheck,
  options: AvatarOptions,
): Promise<AvatarResponse> {
  if (!isOpenAIConfigured()) {
    const pattern = analysis.behavioralPatterns[0]?.label ?? "a familiar role"
    return {
      openingLine: "Something in this repeats.",
      mirror: "You describe responsibility, but the shape also carries exhaustion.",
      patternName: pattern,
      contradiction: "Part of you wants relief while another part protects the role that keeps you needed.",
      socraticQuestion: "What would become possible if one thing did not have to be carried by you today?",
      integrationStep: "Write one sentence beginning with: I am allowed to not carry...",
      closingLine: "Keep the answer small enough to practice.",
    }
  }

  const response = await openai.responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${AVATAR_SYSTEM_PROMPT}

Return a short structured reflection.
If a field does not fit, return an empty string for that field.
Avoid advice, diagnosis, certainty, motivational slogans, and destabilizing language.
Always include one small integration step.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          journalEntry: text,
          analysis,
          safety,
          preferences: {
            tone: options.tone,
            intensity: options.intensity,
            level: LEVELS[Math.max(0, options.currentLevel - 1)],
            avatarStage: AVATAR_STAGES[Math.max(0, options.avatarStage - 1)],
          },
        }),
      },
    ],
    text: {
      format: zodTextFormat(AvatarResponseSchema, "avatar_response"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Avatar generator returned no structured output.")
  }

  return response.output_parsed
}
