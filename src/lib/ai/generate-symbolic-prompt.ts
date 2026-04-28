import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_SYSTEM_PROMPT, LEVELS } from "@/lib/ai/avatar-system-prompt"
import { isOpenAIConfigured, openai, reflectiveModel } from "@/lib/ai/openai"
import {
  GeneratedPromptSchema,
  type EntryAnalysis,
  type GeneratedPrompt,
  type SafetyCheck,
} from "@/lib/ai/schemas"

export async function generateSymbolicPrompt(
  analysis: EntryAnalysis,
  safety: SafetyCheck,
): Promise<GeneratedPrompt> {
  const level = safety.severity === "medium" || safety.severity === "high" ? 1 : analysis.suggestedLevel

  if (!isOpenAIConfigured()) {
    const targetPattern = analysis.behavioralPatterns[0]?.label ?? "self-protection"

    return {
      title: "The Weight You Can Set Down",
      context: "Some responsibilities become familiar because they arrive before choice.",
      materialsAndPreparation: "Choose one small object near you and place it on a steady surface.",
      execution: "Write the name of one responsibility you usually accept without pausing. Move the object a few inches away and leave it there for one minute.",
      integration: "What changes when responsibility is noticed before it is accepted?",
      level,
      targetPattern,
    }
  }

  const response = await openai.responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${AVATAR_SYSTEM_PROMPT}

Generate one safe, grounded journaling prompt.
It may be poetic, but it must stay accessible and emotionally stabilizing.
Do not prescribe intense confrontation, isolation, sleep deprivation, fasting, humiliation, or risky behavior.
For medium or high safety concerns, use only a grounding prompt at Level 1.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          level,
          levelName: LEVELS[level - 1],
          analysis,
          safety,
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
