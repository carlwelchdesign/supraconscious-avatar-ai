import { zodTextFormat } from "openai/helpers/zod"
import { GUIDE_VOICE_SYSTEM_PROMPT, validateGuideVoiceText } from "./guide-voice-contract.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import { languageInstruction, localAiCopy, type ResponseLanguage } from "@inner-avatar/ai/response-language"
import { buildCrisisGroundingContent, shouldShortCircuitReflection } from "./safety-policy.js"
import {
  AvatarResponseSchema,
  type AvatarResponse,
  type EntryAnalysis,
  type SafetyCheck,
} from "./schemas.js"

type AvatarOptions = {
  tone: string
  intensity: number
  language?: ResponseLanguage
}

export async function generateAvatarResponse(
  text: string,
  analysis: EntryAnalysis,
  safety: SafetyCheck,
  options: AvatarOptions,
): Promise<AvatarResponse> {
  const language = options.language ?? "en"
  if (shouldShortCircuitReflection(safety)) {
    return buildGroundingAvatarResponse(safety, language)
  }
  if (!isOpenAIConfigured()) {
    return buildLocalAvatarResponse(analysis, language)
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${GUIDE_VOICE_SYSTEM_PROMPT}

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

  const output = response.output_parsed
  const voiceCheck = validateGuideVoiceText(Object.values(output).filter(Boolean).join("\n"))
  return voiceCheck.valid ? output : buildLocalAvatarResponse(analysis, language)
}

function buildGroundingAvatarResponse(safety: SafetyCheck, language: ResponseLanguage): AvatarResponse {
  const grounding = buildCrisisGroundingContent(safety, language)
  return {
    openingLine: grounding.openingLine,
    mirror: grounding.userMessage,
    patternName: grounding.patternName,
    contradiction: "",
    socraticQuestion: grounding.immediateAction,
    integrationStep: grounding.connectionAction,
    closingLine: grounding.closingLine,
  }
}

function buildLocalAvatarResponse(analysis: EntryAnalysis, language: ResponseLanguage): AvatarResponse {
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
