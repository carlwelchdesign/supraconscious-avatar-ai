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

type SmokeFixtureState = {
  userEmail: string
  createdUser: boolean
  createdSourceDocument: boolean
  featureFlags: Array<{ key: string; existed: boolean; enabled: boolean | null }>
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

export async function runInternalRagSmoke(options: { userEmail?: string; requestPrefix?: string; cleanup?: boolean; seedFixtures?: boolean } = {}): Promise<InternalRagSmokeReport> {
  const checkedAt = new Date().toISOString()
  const userEmail = options.userEmail ?? process.env.INTERNAL_RAG_SMOKE_USER_EMAIL ?? "demo@inner-avatar.ai"
  const requestPrefix = options.requestPrefix ?? `internal-rag-smoke-${Date.now()}`
  const cleanup = options.cleanup ?? true
  const seedFixtures = options.seedFixtures ?? process.env.INTERNAL_RAG_SMOKE_SEED_FIXTURES !== "false"
  const previousCleanup = cleanup ? await cleanupInternalRagSmokeArtifacts("internal-rag-smoke-") : 0
  const fixtureState = seedFixtures ? await ensureInternalRagSmokeFixtures(userEmail) : null
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
    const report = {
      passed: false,
      checkedAt,
      ragEnabled,
      cases: [failedCase],
      selectedSources: [],
      noSourceCases: [],
      failedCases: [failedCase],
      cleanedArtifacts: { previousRuns: previousCleanup, currentRun: 0 },
    }
    if (fixtureState && cleanup) {
      await cleanupInternalRagSmokeFixtures(fixtureState)
    }
    return report
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
  if (fixtureState && cleanup) {
    await cleanupInternalRagSmokeFixtures(fixtureState)
  }
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

async function ensureInternalRagSmokeFixtures(userEmail: string): Promise<SmokeFixtureState> {
  const normalizedEmail = userEmail.toLowerCase()
  const [existingUser, existingSourceDocument, ...featureFlags] = await Promise.all([
    prisma.user.findUnique({ where: { email: normalizedEmail }, select: { id: true } }),
    prisma.sourceDocument.findUnique({ where: { id: "internal-rag-smoke-product-doctrine" }, select: { id: true } }),
    prisma.featureFlag.findUnique({ where: { key: "rag_enabled" }, select: { enabled: true } }),
    prisma.featureFlag.findUnique({ where: { key: "council_mode" }, select: { enabled: true } }),
  ])

  await Promise.all([
    prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {},
      create: {
        email: normalizedEmail,
        name: "Internal RAG Smoke User",
        emailVerified: true,
        onboardingComplete: true,
        patternMemoryEnabled: false,
      },
    }),
    prisma.featureFlag.upsert({
      where: { key: "rag_enabled" },
      update: { enabled: true },
      create: {
        key: "rag_enabled",
        enabled: true,
        description: "Enabled temporarily by the internal RAG smoke test.",
        metadata: { fixture: "internal-rag-smoke" },
      },
    }),
    prisma.featureFlag.upsert({
      where: { key: "council_mode" },
      update: { enabled: true },
      create: {
        key: "council_mode",
        enabled: true,
        description: "Enabled temporarily by the internal RAG smoke test.",
        metadata: { fixture: "internal-rag-smoke" },
      },
    }),
  ])

  await prisma.sourceDocument.upsert({
    where: { id: "internal-rag-smoke-product-doctrine" },
    update: {
      title: "Internal RAG Smoke Product Doctrine",
      sourceType: "product_doctrine",
      rightsStatus: "paraphrase_only",
      reviewState: "approved",
      metadata: { fixture: "internal-rag-smoke", fixtureVersion: 1 },
    },
    create: {
      id: "internal-rag-smoke-product-doctrine",
      title: "Internal RAG Smoke Product Doctrine",
      author: "Inner Avatar AI",
      work: "Internal smoke fixture",
      sourceType: "product_doctrine",
      filePath: "internal://rag-smoke/product-doctrine",
      checksum: "internal-rag-smoke-product-doctrine-v1",
      rightsStatus: "paraphrase_only",
      reviewState: "approved",
      metadata: { fixture: "internal-rag-smoke", fixtureVersion: 1 },
    },
  })

  await prisma.sourceRightsGrant.upsert({
    where: { id: "internal-rag-smoke-rights" },
    update: {
      allowedUses: ["internal_retrieval", "paraphrase_generation"],
      quoteAllowed: false,
      status: "paraphrase_only",
      revokedAt: null,
      expiresAt: null,
      reason: "Synthetic smoke fixture for policy-first RAG retrieval verification.",
      metadata: { fixture: "internal-rag-smoke", fixtureVersion: 1 },
    },
    create: {
      id: "internal-rag-smoke-rights",
      sourceDocumentId: "internal-rag-smoke-product-doctrine",
      ownerName: "Inner Avatar AI",
      grantType: "synthetic_smoke_fixture",
      allowedUses: ["internal_retrieval", "paraphrase_generation"],
      quoteAllowed: false,
      attributionRequired: false,
      status: "paraphrase_only",
      reviewedAt: new Date(),
      reason: "Synthetic smoke fixture for policy-first RAG retrieval verification.",
      metadata: { fixture: "internal-rag-smoke", fixtureVersion: 1 },
    },
  })

  const fixtures = [
    {
      key: "inner-council",
      heading: ["Inner Council"],
      text: "The Inner Council gives the Protector, Conditioned Self, Visionary, and Truth Self a bounded way to speak. No single part rules; the integrator asks one clarifying question so the person can choose a small conscious next step.",
      conceptTags: ["inner_council"],
      councilRoleTags: ["protector", "conditioned_self", "visionary", "truth_self", "integrator"],
    },
    {
      key: "embodiment-gate",
      heading: ["Embodiment Gate"],
      text: "The Embodiment Gate turns insight into a lived micro shift. Crossing the Gate means choosing one small action that can be carried today instead of forcing a complete transformation.",
      conceptTags: ["embodiment_gate"],
      councilRoleTags: ["integrator"],
    },
    {
      key: "architecture-of-self",
      heading: ["Architecture of Self"],
      text: "The architecture of the self includes the observer, conditioned self, protective patterns, and the conscious chooser. Reflection separates the old script from the present choice so awareness can become action.",
      conceptTags: ["supraconsciousness"],
      councilRoleTags: ["conditioned_self", "truth_self", "integrator"],
    },
  ] as const

  for (const fixture of fixtures) {
    const sectionId = `internal-rag-smoke-section-${fixture.key}`
    const chunkId = `internal-rag-smoke-chunk-${fixture.key}`
    await prisma.sourceSection.upsert({
      where: { id: sectionId },
      update: {
        headingPath: fixture.heading,
        canonicalText: fixture.text,
        reviewState: "approved",
      },
      create: {
        id: sectionId,
        sourceDocumentId: "internal-rag-smoke-product-doctrine",
        headingPath: fixture.heading,
        sectionType: "section",
        canonicalText: fixture.text,
        reviewState: "approved",
      },
    })
    await prisma.sourceChunk.upsert({
      where: { id: chunkId },
      update: {
        sourceSectionId: sectionId,
        chunkText: fixture.text,
        quoteSafeExcerpt: null,
        tokenCount: countFixtureTokens(fixture.text),
        sourcePriority: 100,
        conceptTags: fixture.conceptTags,
        councilRoleTags: fixture.councilRoleTags,
        safetyIntensity: "normal",
        quotePermission: "paraphrase_only",
        reviewState: "approved",
      },
      create: {
        id: chunkId,
        sourceDocumentId: "internal-rag-smoke-product-doctrine",
        sourceSectionId: sectionId,
        chunkText: fixture.text,
        quoteSafeExcerpt: null,
        tokenCount: countFixtureTokens(fixture.text),
        sourcePriority: 100,
        conceptTags: fixture.conceptTags,
        councilRoleTags: fixture.councilRoleTags,
        safetyIntensity: "normal",
        quotePermission: "paraphrase_only",
        reviewState: "approved",
      },
    })
  }

  return {
    userEmail: normalizedEmail,
    createdUser: !existingUser,
    createdSourceDocument: !existingSourceDocument,
    featureFlags: [
      { key: "rag_enabled", existed: Boolean(featureFlags[0]), enabled: featureFlags[0]?.enabled ?? null },
      { key: "council_mode", existed: Boolean(featureFlags[1]), enabled: featureFlags[1]?.enabled ?? null },
    ],
  }
}

async function cleanupInternalRagSmokeFixtures(state: SmokeFixtureState) {
  await Promise.all(state.featureFlags.map((flag) => (
    flag.existed
      ? prisma.featureFlag.update({ where: { key: flag.key }, data: { enabled: Boolean(flag.enabled) } })
      : prisma.featureFlag.deleteMany({ where: { key: flag.key } })
  )))

  if (state.createdSourceDocument) {
    await prisma.sourceDocument.deleteMany({ where: { id: "internal-rag-smoke-product-doctrine" } })
  }

  if (state.createdUser) {
    await prisma.user.deleteMany({ where: { email: state.userEmail } })
  }
}

function countFixtureTokens(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length
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
