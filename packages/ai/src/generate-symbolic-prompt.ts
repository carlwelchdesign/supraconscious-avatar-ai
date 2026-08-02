import { zodTextFormat } from "openai/helpers/zod"
import { GUIDE_VOICE_SYSTEM_PROMPT, validateGuideVoiceText } from "./guide-voice-contract.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import { languageInstruction, localAiCopy, type ResponseLanguage } from "@inner-avatar/ai/response-language"
import { buildCrisisGroundingContent, shouldShortCircuitReflection } from "./safety-policy.js"
import {
  GeneratedPromptSchema,
  type EntryAnalysis,
  type GeneratedPrompt,
  type SafetyCheck,
} from "./schemas.js"

export async function generateSymbolicPrompt(
  analysis: EntryAnalysis,
  safety: SafetyCheck,
  language: ResponseLanguage = "en",
): Promise<GeneratedPrompt> {
  const level = safety.severity === "medium" || safety.severity === "high" ? 1 : analysis.suggestedLevel

  if (shouldShortCircuitReflection(safety)) {
    return buildGroundingSymbolicPrompt(safety, language)
  }

  if (!isOpenAIConfigured()) {
    return buildLocalSymbolicPrompt(analysis, language, level)
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${GUIDE_VOICE_SYSTEM_PROMPT}

Generate one safe, grounded journaling prompt.
It may be poetic, but it must stay accessible and emotionally stabilizing.
Do not prescribe intense confrontation, isolation, sleep deprivation, fasting, humiliation, or risky behavior.
For medium or high safety concerns, use only a grounding prompt at Level 1.
${languageInstruction(language)}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          analysis,
          safety,
          language,
        }),
      },
    ],
    text: {
      format: zodTextFormat(GeneratedPromptSchema, "generated_prompt"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Prompt generator returned no structured output.")
  }

  const output = { ...response.output_parsed, level }
  const voiceCheck = validateGuideVoiceText(
    [output.title, output.context, output.materialsAndPreparation, output.execution, output.integration]
      .filter(Boolean)
      .join("\n"),
  )
  return voiceCheck.valid ? output : buildLocalSymbolicPrompt(analysis, language, level)
}

function buildGroundingSymbolicPrompt(safety: SafetyCheck, language: ResponseLanguage): GeneratedPrompt {
  const grounding = buildCrisisGroundingContent(safety, language)
  return {
    title: grounding.openingLine,
    context: grounding.userMessage,
    materialsAndPreparation: grounding.immediateAction,
    execution: grounding.connectionAction,
    integration: grounding.closingLine,
    level: 1,
    targetPattern: grounding.patternName,
  }
}

function buildLocalSymbolicPrompt(
  analysis: EntryAnalysis,
  language: ResponseLanguage,
  level: number,
): GeneratedPrompt {
  const copy = localAiCopy(language).prompt
  const targetPattern = analysis.behavioralPatterns[0]?.label ?? copy.targetPattern

  return {
    title: copy.title,
    context: copy.context,
    materialsAndPreparation: copy.materialsAndPreparation,
    execution: copy.execution,
    integration: copy.integration,
    level,
    targetPattern,
  }
}
