import { prisma } from "@inner-avatar/db"
import { validateCouncilRunForPilot } from "./council-pilot-validator.js"
import { buildCouncilPromptVersion, resolveCouncilPromptTemplate } from "./council-prompt-template.js"
import { runFounderCalibrationFixtures, type FounderCalibrationFixtureCase } from "./founder-calibration-fixtures.js"
import type { CouncilRun } from "./schemas.js"

export type FounderCalibrationRegressionCase = {
  name: string
  passed: boolean
  failedRules: string[]
  warnings: string[]
  promptVersion: string | null
  source: "fixture" | "golden_example"
}

export type FounderCalibrationRegressionReport = {
  passed: boolean
  cases: FounderCalibrationRegressionCase[]
  failedCases: FounderCalibrationRegressionCase[]
  promptVersion: string
  goldenExampleCount: number
  recommendations: string[]
}

type GoldenSession = {
  id: string
    sourceMode: string
    safetySnapshot: unknown
    observerSignal: unknown
  messages: Array<{
    role: string
    displayName: string
    lens: string
    content: string
    evidence: unknown
    confidence: number
    riskLevel: string
    abstained: boolean
    abstainReason: string | null
    sourceChunkIds: unknown
  }>
  synthesis: {
    guideName: string
    openingLine: string | null
    coreTension: string | null
    integratorQuestion: string
    integrationStep: string
    closingLine: string | null
    sourceChunkIds: unknown
  } | null
  generationTraces: Array<{
    promptVersion: string | null
    outputJson: unknown
  }>
}

export async function runFounderCalibrationRegression(): Promise<FounderCalibrationRegressionReport> {
  const promptTemplate = await resolveCouncilPromptTemplate()
  const promptVersion = buildCouncilPromptVersion(promptTemplate)
  const fixtureReport = runFounderCalibrationFixtures()
  const fixtureCases = fixtureReport.cases.map(toRegressionFixtureCase)

  const goldenSessions = await prisma.councilSession.findMany({
    where: { qualityReviews: { some: { label: "ready" } } },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      sourceMode: true,
      safetySnapshot: true,
      observerSignal: true,
      messages: {
        orderBy: { createdAt: "asc" },
        select: {
          role: true,
          displayName: true,
          lens: true,
          content: true,
          evidence: true,
          confidence: true,
          riskLevel: true,
          abstained: true,
          abstainReason: true,
          sourceChunkIds: true,
        },
      },
      synthesis: {
        select: {
          guideName: true,
          openingLine: true,
          coreTension: true,
          integratorQuestion: true,
          integrationStep: true,
          closingLine: true,
          sourceChunkIds: true,
        },
      },
      generationTraces: {
        where: { traceType: "council" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { promptVersion: true, outputJson: true },
      },
    },
  })

  const goldenCases = goldenSessions.map(toGoldenRegressionCase)
  const cases = [...fixtureCases, ...goldenCases]
  const failedCases = cases.filter((item) => !item.passed)

  return {
    passed: failedCases.length === 0,
    cases,
    failedCases,
    promptVersion,
    goldenExampleCount: goldenCases.length,
    recommendations: failedCases.length === 0
      ? ["Founder calibration regression passes. Prompt changes remain inside current safety and voice boundaries."]
      : failedCases.map((item) => `Fix ${item.name}: ${item.failedRules.join(", ")}`),
  }
}

function toRegressionFixtureCase(item: FounderCalibrationFixtureCase): FounderCalibrationRegressionCase {
  return {
    name: item.name,
    passed: item.passed,
    failedRules: item.failedRules,
    warnings: item.warnings,
    promptVersion: "fixture",
    source: "fixture",
  }
}

function toGoldenRegressionCase(session: GoldenSession): FounderCalibrationRegressionCase {
  const promptVersion = session.generationTraces[0]?.promptVersion ?? null
  const run = readCouncilRun(session)
  const validation = validateCouncilRunForPilot(run, {
    safety: readSafety(session.safetySnapshot),
    sourceMode: session.sourceMode,
  })
  const failedRules = [...validation.failedRules]
  if (!promptVersion) failedRules.push("prompt_version_missing")

  return {
    name: `golden:${session.id}`,
    passed: failedRules.length === 0,
    failedRules,
    warnings: validation.warnings,
    promptVersion,
    source: "golden_example",
  }
}

function readCouncilRun(session: GoldenSession): CouncilRun {
  const traceRun = session.generationTraces[0]?.outputJson
  if (traceRun && typeof traceRun === "object" && "councilRun" in traceRun) {
    return (traceRun as { councilRun: CouncilRun }).councilRun
  }

  return {
    observer: session.observerSignal as CouncilRun["observer"],
    messages: session.messages.map((message) => ({
      role: message.role as CouncilRun["messages"][number]["role"],
      displayName: message.displayName,
      lens: message.lens,
      content: message.content,
      evidence: Array.isArray(message.evidence) ? message.evidence.filter((item): item is string => typeof item === "string") : [],
      confidence: message.confidence,
      riskLevel: message.riskLevel as CouncilRun["messages"][number]["riskLevel"],
      abstained: message.abstained,
      abstainReason: message.abstainReason ?? "",
      sourceChunkIds: readStringArray(message.sourceChunkIds),
    })),
    synthesis: {
      guideName: session.synthesis?.guideName ?? "Supraconscious Guide",
      openingLine: session.synthesis?.openingLine ?? "",
      coreTension: session.synthesis?.coreTension ?? "",
      integratorQuestion: session.synthesis?.integratorQuestion ?? "What becomes clear now?",
      integrationStep: session.synthesis?.integrationStep ?? "",
      closingLine: session.synthesis?.closingLine ?? "",
      sourceChunkIds: readStringArray(session.synthesis?.sourceChunkIds),
    },
  }
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function readSafety(value: unknown) {
  if (!value || typeof value !== "object") return undefined
  const record = value as { severity?: unknown; flags?: unknown; recommendedAction?: unknown; userMessage?: unknown; allowReflectiveFlow?: unknown }
  if (typeof record.severity !== "string") return undefined
  return {
    severity: record.severity as "none" | "low" | "medium" | "high",
    flags: Array.isArray(record.flags) ? record.flags.filter((item): item is string => typeof item === "string") : [],
    recommendedAction: typeof record.recommendedAction === "string" ? record.recommendedAction : "reflect",
    userMessage: typeof record.userMessage === "string" ? record.userMessage : "Reflective flow is available.",
    allowReflectiveFlow: typeof record.allowReflectiveFlow === "boolean" ? record.allowReflectiveFlow : record.severity !== "high",
  }
}
