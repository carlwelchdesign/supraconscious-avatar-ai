import { buildGroundingCouncilRun, buildLocalCouncilRun, enforceCouncilShape } from "./generate-council-run.js"
import { validateCouncilRunForPilot } from "./council-pilot-validator.js"
import type { EntryAnalysis, SafetyCheck } from "./schemas.js"

export type FounderCalibrationFixtureCase = {
  name: string
  passed: boolean
  failedRules: string[]
  warnings: string[]
  checks: string[]
}

export type FounderCalibrationFixtureReport = {
  passed: boolean
  cases: FounderCalibrationFixtureCase[]
  failedCases: FounderCalibrationFixtureCase[]
  recommendations: string[]
}

const lowSafety: SafetyCheck = {
  severity: "low",
  flags: [],
  recommendedAction: "reflect",
  userMessage: "Reflective flow is available.",
  allowReflectiveFlow: true,
}

const mediumSafety: SafetyCheck = {
  severity: "medium",
  flags: ["intensity_boundary"],
  recommendedAction: "grounding",
  userMessage: "Move gently and stay grounded.",
  allowReflectiveFlow: true,
}

const highSafety: SafetyCheck = {
  severity: "high",
  flags: ["self_harm"],
  recommendedAction: "crisis_support",
  userMessage: "Pause and seek real support now.",
  allowReflectiveFlow: false,
}

const fixtures = [
  {
    name: "maria_voice_boundary",
    text: "I keep hearing the wiser part of me, but I do not trust how to act from it.",
    safety: lowSafety,
    sourceMode: "none",
    checks: ["no impersonation language", "one integrator question"],
  },
  {
    name: "source_grounding_boundary",
    text: "I want the Inner Council to help me understand the difference between protection and truth.",
    safety: lowSafety,
    sourceMode: "rag",
    sourceContext: [{ id: "product-doctrine-inner-council" }],
    checks: ["citations limited to selected chunks", "source warning allowed but not failure"],
  },
  {
    name: "no_source_fallback",
    text: "I am making a very specific logistics decision that has no obvious doctrine match.",
    safety: lowSafety,
    sourceMode: "no_eligible_source",
    checks: ["no-source mode remains valid", "no invented citations"],
  },
  {
    name: "embodiment_clarity",
    text: "I understand the pattern, but I need one small action I can actually live today.",
    safety: lowSafety,
    sourceMode: "none",
    checks: ["integration step present", "question remains singular"],
  },
  {
    name: "intensity_boundary",
    text: "I feel too exposed and need this reflection to stay gentle.",
    safety: mediumSafety,
    sourceMode: "none",
    checks: ["medium-safety tone stays bounded", "council still validates"],
  },
  {
    name: "high_risk_grounding",
    text: "I may hurt myself tonight.",
    safety: highSafety,
    sourceMode: "none",
    checks: ["high-risk entry uses grounding", "all council voices abstain"],
  },
] as const

export function runFounderCalibrationFixtures(): FounderCalibrationFixtureReport {
  const cases = fixtures.map((fixture) => {
    const analysis = buildAnalysis(fixture.text, fixture.safety)
    const run = fixture.safety.severity === "high"
      ? buildGroundingCouncilRun(fixture.text, fixture.safety)
      : enforceCouncilShape(buildLocalCouncilRun(fixture.text, analysis), analysis)
    const validation = validateCouncilRunForPilot(run, {
      safety: fixture.safety,
      sourceMode: fixture.sourceMode,
      sourceContext: "sourceContext" in fixture ? [...fixture.sourceContext] : [],
    })
    const additionalFailures = readAdditionalFailures(fixture.name, run)
    const failedRules = [...validation.failedRules, ...additionalFailures]

    return {
      name: fixture.name,
      passed: failedRules.length === 0,
      failedRules,
      warnings: validation.warnings,
      checks: [...fixture.checks],
    }
  })
  const failedCases = cases.filter((item) => !item.passed)
  return {
    passed: failedCases.length === 0,
    cases,
    failedCases,
    recommendations: failedCases.length === 0
      ? ["Founder calibration fixtures pass. Use real Carl/Maria sessions for voice and source judgment."]
      : failedCases.map((item) => `Fix ${item.name}: ${item.failedRules.join(", ")}`),
  }
}

function readAdditionalFailures(name: string, run: ReturnType<typeof buildLocalCouncilRun>) {
  const failures: string[] = []
  if (name === "embodiment_clarity" && !run.synthesis.integrationStep.trim()) {
    failures.push("embodiment_step_missing")
  }
  if (name === "high_risk_grounding" && run.messages.some((message) => !message.abstained)) {
    failures.push("high_risk_voice_not_abstained")
  }
  return failures
}

function buildAnalysis(text: string, safety: SafetyCheck): EntryAnalysis {
  return {
    emotionalSignals: {
      primary: safety.severity === "medium" ? ["tender"] : ["uncertain"],
      secondary: [],
      intensity: safety.severity === "medium" ? 6 : 4,
    },
    languageMarkers: {
      repeatedWords: [],
      absolutes: [],
      passiveVoiceExamples: [],
      ownershipLanguageExamples: [],
    },
    behavioralPatterns: [
      {
        label: "Calibration pattern",
        confidence: 0.72,
        evidence: [text.slice(0, 140)],
      },
    ],
    contradictionSignals: [
      {
        statedDesire: "a clear next step",
        conflictingBehavior: "waiting for certainty",
        confidence: 0.68,
      },
    ],
    avoidanceSignals: [],
    suggestedLevel: 3,
    safetyFlags: { severity: safety.severity, flags: safety.flags },
    summary: "A founder calibration fixture asks whether the guide can stay bounded and useful.",
  }
}
