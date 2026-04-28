import { zodTextFormat } from "openai/helpers/zod"
import { AVATAR_SYSTEM_PROMPT } from "@/lib/ai/avatar-system-prompt"
import { isOpenAIConfigured, openai, reflectiveModel } from "@/lib/ai/openai"
import { EntryAnalysisSchema, type EntryAnalysis, type SafetyCheck } from "@/lib/ai/schemas"

export async function analyzeEntry(text: string, safety: SafetyCheck): Promise<EntryAnalysis> {
  if (!isOpenAIConfigured()) {
    return analyzeEntryLocally(text, safety)
  }

  const response = await openai.responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `${AVATAR_SYSTEM_PROMPT}

Analyze the user's journal entry into structured data only.
Use grounded, non-clinical language.
Do not infer diagnosis, trauma, disorder, or certainty.
Use short evidence excerpts only.
Suggested level must be 1 if safety severity is medium or high.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          safety,
          journalEntry: text,
        }),
      },
    ],
    text: {
      format: zodTextFormat(EntryAnalysisSchema, "entry_analysis"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Entry analyzer returned no structured output.")
  }

  return response.output_parsed
}

function analyzeEntryLocally(text: string, safety: SafetyCheck): EntryAnalysis {
  const repeatedWords = Array.from(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, "")
      .split(/\s+/)
      .filter((word) => word.length > 4)
      .reduce((counts, word) => counts.set(word, (counts.get(word) ?? 0) + 1), new Map<string, number>()),
  )
    .filter(([, count]) => count > 1)
    .map(([word]) => word)
    .slice(0, 6)

  const pattern = inferPattern(text)

  return {
    emotionalSignals: {
      primary: ["pressure"],
      secondary: ["fatigue", "concern"],
      intensity: safety.severity === "medium" ? 6 : 4,
    },
    languageMarkers: {
      repeatedWords,
      absolutes: findMatches(text, ["always", "never", "everything", "nothing", "everyone"]),
      passiveVoiceExamples: [],
      ownershipLanguageExamples: findMatches(text, ["I noticed", "I know", "I choose", "part of me", "I tell myself"]),
    },
    behavioralPatterns: [
      {
        label: pattern,
        confidence: 0.72,
        evidence: [text.slice(0, 180)],
      },
    ],
    contradictionSignals: [
      {
        statedDesire: "Relief or clarity",
        conflictingBehavior: "Continuing the role that creates pressure",
        confidence: 0.62,
      },
    ],
    avoidanceSignals: [],
    suggestedLevel: safety.severity === "medium" ? 1 : 2,
    safetyFlags: {
      severity: safety.severity,
      flags: safety.flags,
    },
    summary: `A repeated pattern around ${pattern.toLowerCase()} may be present, with language that suggests pressure and emerging self-awareness.`,
  }
}

function inferPattern(text: string) {
  const normalized = text.toLowerCase()
  if (normalized.includes("yes") || normalized.includes("disappointed") || normalized.includes("responsibility")) {
    return "Over-responsibility"
  }
  if (normalized.includes("perfect") || normalized.includes("mistake")) return "Perfectionism"
  if (normalized.includes("avoid") || normalized.includes("later")) return "Avoidance"
  if (normalized.includes("approval") || normalized.includes("validate")) return "Validation seeking"
  return "Self-protection"
}

function findMatches(text: string, phrases: string[]) {
  const normalized = text.toLowerCase()
  return phrases.filter((phrase) => normalized.includes(phrase.toLowerCase()))
}
