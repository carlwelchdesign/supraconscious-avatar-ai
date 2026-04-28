import { zodTextFormat } from "openai/helpers/zod"
import { isOpenAIConfigured, openai, reflectiveModel } from "@/lib/ai/openai"
import { SafetyCheckSchema, type SafetyCheck } from "@/lib/ai/schemas"

export async function classifyJournalSafety(text: string): Promise<SafetyCheck> {
  if (!isOpenAIConfigured()) {
    return classifyJournalSafetyLocally(text)
  }

  const response = await openai.responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content:
          "Classify journaling text for safety. Do not diagnose. Identify crisis, self-harm, harm-to-others, abuse/coercion, psychosis-like destabilization, severe dissociation, minors, or unsafe dependency patterns. Return grounded, concise handling guidance.",
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

function classifyJournalSafetyLocally(text: string): SafetyCheck {
  const normalized = text.toLowerCase()
  const highRisk = ["kill myself", "suicide", "end my life", "hurt myself", "harm myself", "hurt someone", "kill them"]
  const mediumRisk = ["can't go on", "not safe", "dissociate", "dissociation", "unreal", "abuse", "coerced"]
  const highFlags = highRisk.filter((phrase) => normalized.includes(phrase))
  const mediumFlags = mediumRisk.filter((phrase) => normalized.includes(phrase))

  if (highFlags.length) {
    return {
      severity: "high",
      flags: highFlags,
      recommendedAction: "Use crisis-oriented support and avoid normal reflective prompting.",
      userMessage: "This sounds urgent enough to pause reflection and connect with immediate support. If you may be in danger, contact emergency services or a crisis line now.",
      allowReflectiveFlow: false,
    }
  }

  if (mediumFlags.length) {
    return {
      severity: "medium",
      flags: mediumFlags,
      recommendedAction: "Use grounding language and keep the prompt simple.",
      userMessage: "This entry carries distress. Stay with orientation before interpretation.",
      allowReflectiveFlow: true,
    }
  }

  return {
    severity: "none",
    flags: [],
    recommendedAction: "Continue normal reflective flow.",
    userMessage: "No acute safety concern detected.",
    allowReflectiveFlow: true,
  }
}
