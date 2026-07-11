import { zodTextFormat } from "openai/helpers/zod"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import { languageInstruction, localAiCopy, type ResponseLanguage } from "@inner-avatar/ai/response-language"
import { SafetyCheckSchema, type SafetyCheck } from "./schemas.js"

export async function classifyJournalSafety(text: string, language: ResponseLanguage = "en"): Promise<SafetyCheck> {
  if (!isOpenAIConfigured()) {
    return classifyJournalSafetyLocally(text, language)
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content:
          `Classify journaling text for safety. Do not diagnose. Identify crisis, self-harm, harm-to-others, abuse/coercion, psychosis-like destabilization, severe dissociation, minors, or unsafe dependency patterns. Return grounded, concise handling guidance.

${languageInstruction(language)}`,
      },
      {
        role: "user",
        content: text,
      },
    ],
    text: {
      format: zodTextFormat(SafetyCheckSchema, "safety_check"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Safety classifier returned no structured output.")
  }

  return response.output_parsed
}

function classifyJournalSafetyLocally(text: string, language: ResponseLanguage): SafetyCheck {
  const copy = localAiCopy(language).safety
  const normalized = text.toLowerCase()
  const highRisk = ["kill myself", "suicide", "end my life", "hurt myself", "harm myself", "hurt someone", "kill them"]
  const mediumRisk = ["can't go on", "not safe", "dissociate", "dissociation", "unreal", "abuse", "coerced"]
  const highFlags = highRisk.filter((phrase) => normalized.includes(phrase))
  const mediumFlags = mediumRisk.filter((phrase) => normalized.includes(phrase))

  if (highFlags.length) {
    return {
      severity: "high",
      flags: highFlags,
      recommendedAction: copy.highRecommendedAction,
      userMessage: copy.highUserMessage,
      allowReflectiveFlow: false,
    }
  }

  if (mediumFlags.length) {
    return {
      severity: "medium",
      flags: mediumFlags,
      recommendedAction: copy.mediumRecommendedAction,
      userMessage: copy.mediumUserMessage,
      allowReflectiveFlow: true,
    }
  }

  return {
    severity: "none",
    flags: [],
    recommendedAction: copy.noneRecommendedAction,
    userMessage: copy.noneUserMessage,
    allowReflectiveFlow: true,
  }
}
