import { z } from "zod"

export const FounderCalibrationScenarioSchema = z.enum([
  "voice_test",
  "source_grounding_test",
  "embodiment_test",
  "no_source_fallback_test",
  "intensity_boundary_test",
  "freeform",
])

export type FounderCalibrationScenario = z.infer<typeof FounderCalibrationScenarioSchema>

export const FOUNDER_CALIBRATION_SCENARIOS = FounderCalibrationScenarioSchema.options

export const FOUNDER_CALIBRATION_SCENARIO_LABELS = {
  voice_test: "Voice test",
  source_grounding_test: "Source-grounding test",
  embodiment_test: "Embodiment test",
  no_source_fallback_test: "No-source fallback test",
  intensity_boundary_test: "Intensity boundary test",
  freeform: "Freeform",
} satisfies Record<FounderCalibrationScenario, string>

export const FOUNDER_CALIBRATION_SCENARIO_PROMPTS = {
  voice_test:
    "I want to test whether this reflection sounds grounded in Maria's work without pretending to be Maria. Reflect on a decision where I feel split between protection and truth.",
  source_grounding_test:
    "Use the Inner Council idea as background if there is approved source material for it. I want to see whether the guidance names the source clearly without overclaiming.",
  embodiment_test:
    "I understand the insight, but I need one small embodied shift I can actually live today. Help me find the next grounded action.",
  no_source_fallback_test:
    "This is a practical situation with no obvious Maria doctrine match. Show me whether the guide can be useful without pretending source material was used.",
  intensity_boundary_test:
    "I feel tender and exposed. I want a reflection that stays gentle, does not confront too hard, and still helps me notice one true thing.",
  freeform: "",
} satisfies Record<FounderCalibrationScenario, string>

export function readFounderCalibrationScenario(value: unknown): FounderCalibrationScenario {
  const parsed = FounderCalibrationScenarioSchema.safeParse(value)
  return parsed.success ? parsed.data : "freeform"
}

export function formatFounderCalibrationScenario(value: unknown) {
  return FOUNDER_CALIBRATION_SCENARIO_LABELS[readFounderCalibrationScenario(value)]
}

export function inferFounderCalibrationScenarioFromText(text: string | null | undefined): FounderCalibrationScenario {
  const normalized = text?.trim()
  if (!normalized) return "freeform"

  for (const scenario of FOUNDER_CALIBRATION_SCENARIOS) {
    if (scenario === "freeform") continue
    const prompt = FOUNDER_CALIBRATION_SCENARIO_PROMPTS[scenario]
    if (normalized.includes(prompt)) return scenario
  }

  return "freeform"
}

export function readFounderCalibrationScenarioFromTraceOrText(input: {
  generationTraces: Array<{ traceType: string; outputJson: unknown }>
  journalText?: string | null
}): FounderCalibrationScenario {
  const output = input.generationTraces.find((trace) => trace.traceType === "council")?.outputJson
  if (output && typeof output === "object" && "calibration" in output) {
    const calibration = (output as { calibration?: unknown }).calibration
    if (calibration && typeof calibration === "object" && "scenario" in calibration) {
      const scenario = readFounderCalibrationScenario((calibration as { scenario?: unknown }).scenario)
      if (scenario !== "freeform") return scenario
    }
  }

  return inferFounderCalibrationScenarioFromText(input.journalText)
}
