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

export function readFounderCalibrationScenario(value: unknown): FounderCalibrationScenario {
  const parsed = FounderCalibrationScenarioSchema.safeParse(value)
  return parsed.success ? parsed.data : "freeform"
}

export function formatFounderCalibrationScenario(value: unknown) {
  return FOUNDER_CALIBRATION_SCENARIO_LABELS[readFounderCalibrationScenario(value)]
}
