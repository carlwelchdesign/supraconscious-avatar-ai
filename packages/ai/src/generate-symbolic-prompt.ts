import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_SYSTEM_PROMPT, LEVELS } from "./avatar-system-prompt.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import { languageInstruction, localAiCopy, type ResponseLanguage } from "./response-language.js"
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

  if (!isOpenAIConfigured()) {
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

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${AVATAR_SYSTEM_PROMPT}

Generate one safe, grounded journaling prompt.
It may be poetic, but it must stay accessible and emotionally stabilizing.
Do not prescribe intense confrontation, isolation, sleep deprivation, fasting, humiliation, or risky behavior.
For medium or high safety concerns, use only a grounding prompt at Level 1.
${languageInstruction(language)}`,
      },
      {
        role: "user",
        content: JSON.stringify({
          level,
          levelName: LEVELS[level - 1],
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

  return { ...response.output_parsed, level }
}
