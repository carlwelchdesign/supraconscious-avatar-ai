import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_STAGES, AVATAR_SYSTEM_PROMPT, LEVELS } from "./avatar-system-prompt.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import { languageInstruction, localAiCopy, type ResponseLanguage } from "./response-language.js"
import {
  AvatarResponseSchema,
  type AvatarResponse,
  type EntryAnalysis,
  type SafetyCheck,
} from "./schemas.js"

type AvatarOptions = {
  tone: string
  intensity: number
  currentLevel: number
  avatarStage: number
  language?: ResponseLanguage
}

export async function generateAvatarResponse(
  text: string,
  analysis: EntryAnalysis,
  safety: SafetyCheck,
  options: AvatarOptions,
): Promise<AvatarResponse> {
  const language = options.language ?? "en"
  if (!isOpenAIConfigured()) {
    const pattern = analysis.behavioralPatterns[0]?.label ?? "a familiar role"
    const copy = localAiCopy(language).avatar
    return {
      openingLine: copy.openingLine,
      mirror: copy.mirror,
      patternName: pattern,
      contradiction: copy.contradiction,
      socraticQuestion: copy.socraticQuestion,
      integrationStep: copy.integrationStep,
      closingLine: copy.closingLine,
    }
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${AVATAR_SYSTEM_PROMPT}

Return a short structured reflection.
If a field does not fit, return an empty string for that field.
Avoid advice, diagnosis, certainty, motivational slogans, and destabilizing language.
Always include one small integration step.
${languageInstruction(language)}`,
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
            language,
          },
        }),
      },
    ],
    text: {
      format: zodTextFormat(AvatarResponseSchema, "avatar_response"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Guide generator returned no structured output.")
  }

  return response.output_parsed
}
