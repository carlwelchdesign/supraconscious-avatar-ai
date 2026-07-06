import test from "node:test"
import assert from "node:assert/strict"
import { FOUNDER_CALIBRATION_SCENARIO_PROMPTS } from "@inner-avatar/ai/founder-calibration-scenarios"
import { resolveFounderCalibrationSubmissionScenario } from "../src/lib/founder-calibration-submit"

test("founder calibration submit keeps a guided scenario when prompt text remains", () => {
  assert.equal(
    resolveFounderCalibrationSubmissionScenario({
      founderCalibrationMode: true,
      selectedScenario: "voice_test",
      text: `${FOUNDER_CALIBRATION_SCENARIO_PROMPTS.voice_test}\n\nHere is my real situation.`,
    }),
    "voice_test",
  )
})

test("founder calibration submit falls back to freeform when prompt is replaced", () => {
  assert.equal(
    resolveFounderCalibrationSubmissionScenario({
      founderCalibrationMode: true,
      selectedScenario: "voice_test",
      text: "I am writing a normal reflection that should not be counted as the voice test scenario.",
    }),
    "freeform",
  )
})

test("non-founder journal submissions are always freeform", () => {
  assert.equal(
    resolveFounderCalibrationSubmissionScenario({
      founderCalibrationMode: false,
      selectedScenario: "source_grounding_test",
      text: FOUNDER_CALIBRATION_SCENARIO_PROMPTS.source_grounding_test,
    }),
    "freeform",
  )
})
