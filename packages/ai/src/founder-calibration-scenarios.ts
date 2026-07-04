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

export function readFounderCalibrationScenario(value: unknown): FounderCalibrationScenario {
  const parsed = FounderCalibrationScenarioSchema.safeParse(value)
  return parsed.success ? parsed.data : "freeform"
}
