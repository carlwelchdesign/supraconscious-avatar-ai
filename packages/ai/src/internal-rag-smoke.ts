import { prisma } from "@inner-avatar/db"
import { runCouncilReflection } from "./council-reflection-service.js"
import { retrieveCouncilContext } from "./source-context.js"

export type InternalRagSmokeCase = {
  name: string
  expectedSourceMode: "rag" | "no_eligible_source"
  passed: boolean
  sourceMode: string | null
  selectedChunkIds: string[]
  selectedSourceTitles: string[]
  retrievalTraceCount: number
  details?: string
}

export type InternalRagSmokeReport = {
  passed: boolean
  checkedAt: string
  ragEnabled: boolean
  cases: InternalRagSmokeCase[]
  selectedSources: string[]
  noSourceCases: string[]
  failedCases: InternalRagSmokeCase[]
  cleanedArtifacts: {
    previousRuns: number
    currentRun: number
  }
}

const SMOKE_CASES: Array<{ name: string; text: string; expectedSourceMode: "rag" | "no_eligible_source" }> = [
  {
    name: "inner_council_doctrine_match",
    text: "I feel my Inner Council voices arguing. The Protector wants safety, but I need the Truth Self to help me choose a small next step.",
    expectedSourceMode: "rag",
  },
  {
    name: "embodiment_gate_doctrine_match",
    text: "I understand the pattern intellectually, but I need to cross the Embodiment Gate with one micro shift I can actually live today.",
    expectedSourceMode: "rag",
  },
  {
    name: "architecture_of_self_doctrine_match",
    text: "I am trying to understand the architecture of the self, the observer, the conditioned self, and the part of me that can make a conscious choice.",
    expectedSourceMode: "rag",
  },
  {
    name: "no_source_fallback",
    text: "Xylophone marmalade forklift nebula crochet luminous cabbage zircon.",
    expectedSourceMode: "no_eligible_source",
  },
]

export async function runInternalRagSmoke(options: { userEmail?: string; requestPrefix?: string; cleanup?: boolean } = {}): Promise<InternalRagSmokeReport> {
  const checkedAt = new Date().toISOString()
  const userEmail = options.userEmail ?? process.env.INTERNAL_RAG_SMOKE_USER_EMAIL ?? "demo@inner-avatar.ai"
  const requestPrefix = options.requestPrefix ?? `internal-rag-smoke-${Date.now()}`
  const cleanup = options.cleanup ?? true
  const previousCleanup = cleanup ? await cleanupInternalRagSmokeArtifacts("internal-rag-smoke-") : 0
  const [ragFlag, councilFlag, user] = await Promise.all([
    prisma.featureFlag.findUnique({ where: { key: "rag_enabled" }, select: { enabled: true } }),
    prisma.featureFlag.findUnique({ where: { key: "council_mode" }, select: { enabled: true } }),
    prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        avatarTone: true,
        intensityLevel: true,
        currentLevel: true,
        avatarStage: true,
        patternMemoryEnabled: true,
      },
    }),
  ])

  const ragEnabled = ragFlag?.enabled ?? false
  if (!user) {
    const failedCase = {
      name: "pilot_user_missing",
      expectedSourceMode: "rag" as const,
      passed: false,
      sourceMode: null,
      selectedChunkIds: [],
      selectedSourceTitles: [],
      retrievalTraceCount: 0,
      details: `Pilot smoke user not found: ${userEmail}`,
    }
    return {
      passed: false,
      checkedAt,
      ragEnabled,
      cases: [failedCase],
      selectedSources: [],
      noSourceCases: [],
      failedCases: [failedCase],
      cleanedArtifacts: { previousRuns: previousCleanup, currentRun: 0 },
    }
  }

  const cases: InternalRagSmokeCase[] = []
  const currentRunRequestIds: string[] = []
  for (const [index, smokeCase] of SMOKE_CASES.entries()) {
    const preflightContext = await retrieveCouncilContext(smokeCase.text, { safetySeverity: "low" })
    const requestId = `${requestPrefix}-${index + 1}-${smokeCase.name}`
    currentRunRequestIds.push(requestId)
    const result = await runCouncilReflection({ ...user, patternMemoryEnabled: false }, {
      text: smokeCase.text,
      councilModeEnabled: councilFlag?.enabled ?? true,
      ragEnabled,
      requestId,
    })
    const session = "councilSession" in result ? result.councilSession : null
    const retrievalTraces = session
      ? await prisma.generationTrace.findMany({
        where: { councilSessionId: session.id, traceType: "retrieval" },
        select: { sourceChunkId: true, validationStatus: true, outputJson: true },
      })
      : []
    const selectedChunkIds = retrievalTraces
      .map((trace) => trace.sourceChunkId)
      .filter((id): id is string => Boolean(id))
    const selectedSourceTitles = Array.from(new Set(preflightContext.map((chunk) => chunk.title)))
    const sourceMode = session?.sourceMode ?? null
    const expected = ragEnabled ? smokeCase.expectedSourceMode : "none"
    const passed = sourceMode === expected &&
      (expected === "rag" ? selectedChunkIds.length > 0 : selectedChunkIds.length === 0)

    cases.push({
      name: smokeCase.name,
      expectedSourceMode: smokeCase.expectedSourceMode,
      passed,
      sourceMode,
      selectedChunkIds,
      selectedSourceTitles,
      retrievalTraceCount: retrievalTraces.length,
      details: passed ? undefined : `Expected ${expected}; received ${sourceMode ?? "missing session"}.`,
    })
  }

  const failedCases = cases.filter((item) => !item.passed)
  const currentCleanup = cleanup ? await cleanupInternalRagSmokeArtifacts(currentRunRequestIds) : 0
  return {
    passed: ragEnabled && failedCases.length === 0,
    checkedAt,
    ragEnabled,
    cases,
    selectedSources: Array.from(new Set(cases.flatMap((item) => item.selectedSourceTitles))),
    noSourceCases: cases.filter((item) => item.sourceMode === "no_eligible_source").map((item) => item.name),
    failedCases,
    cleanedArtifacts: { previousRuns: previousCleanup, currentRun: currentCleanup },
  }
}

async function cleanupInternalRagSmokeArtifacts(requestIdsOrPrefix: string[] | string) {
  const where = Array.isArray(requestIdsOrPrefix)
    ? { requestId: { in: requestIdsOrPrefix } }
    : { requestId: { startsWith: requestIdsOrPrefix } }
  const events = await prisma.pilotEvent.findMany({
    where,
    select: { id: true, journalEntryId: true, councilSessionId: true },
  })
  const eventIds = events.map((event) => event.id)
  const journalEntryIds = Array.from(new Set(events.map((event) => event.journalEntryId).filter((id): id is string => Boolean(id))))
  const councilSessionIds = Array.from(new Set(events.map((event) => event.councilSessionId).filter((id): id is string => Boolean(id))))

  if (eventIds.length === 0 && journalEntryIds.length === 0 && councilSessionIds.length === 0) return 0

  await prisma.$transaction([
    prisma.generationTrace.deleteMany({ where: { councilSessionId: { in: councilSessionIds } } }),
    prisma.pilotEvent.deleteMany({ where: { id: { in: eventIds } } }),
    prisma.journalEntry.deleteMany({ where: { id: { in: journalEntryIds } } }),
  ])

  return eventIds.length
}
