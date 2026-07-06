import {
  FOUNDER_CALIBRATION_SCENARIO_PROMPTS,
  inferFounderCalibrationScenarioFromText,
  readFounderCalibrationScenario,
  type FounderCalibrationScenario,
} from "@inner-avatar/ai/founder-calibration-scenarios"

export function resolveFounderCalibrationSubmissionScenario(input: {
  founderCalibrationMode: boolean
  text: string
  selectedScenario: FounderCalibrationScenario | "freeform"
}): FounderCalibrationScenario {
  if (!input.founderCalibrationMode) return "freeform"

  const selectedScenario = readFounderCalibrationScenario(input.selectedScenario)
  if (selectedScenario !== "freeform") {
    const selectedPrompt = FOUNDER_CALIBRATION_SCENARIO_PROMPTS[selectedScenario]
    if (input.text.includes(selectedPrompt)) return selectedScenario
  }

  return inferFounderCalibrationScenarioFromText(input.text)
}
