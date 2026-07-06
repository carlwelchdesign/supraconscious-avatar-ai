type PatternMemoryRecord = {
  id: string
  patternType: string
  patternLabel: string
  evidenceCount: number
  confidence: number
  active: boolean
  firstSeenAt: Date | string
  lastSeenAt: Date | string
}

type RecentPatternEntryRecord = {
  id: string
  rawText?: string
  inputMode: string
  createdAt: Date | string
  analysis?: { summary?: string | null } | null
  avatarResponse?: {
    mirror?: string | null
    patternName?: string | null
    integrationStep?: string | null
  } | null
  generatedPrompts?: Array<{
    title: string
    execution: string
    integration: string
  }>
}

export function buildPatternsResponse(input: {
  patterns: PatternMemoryRecord[]
  recentEntries: RecentPatternEntryRecord[]
}) {
  return {
    patterns: input.patterns.map((pattern) => ({
      id: pattern.id,
      patternType: pattern.patternType,
      patternLabel: pattern.patternLabel,
      evidenceCount: pattern.evidenceCount,
      confidence: pattern.confidence,
      active: pattern.active,
      firstSeenAt: serializeDate(pattern.firstSeenAt),
      lastSeenAt: serializeDate(pattern.lastSeenAt),
    })),
    recentEntries: input.recentEntries.map((entry) => ({
      id: entry.id,
      inputMode: entry.inputMode,
      createdAt: serializeDate(entry.createdAt),
      excerpt: buildExcerpt(entry.rawText ?? ""),
      analysis: entry.analysis ? { summary: entry.analysis.summary ?? "" } : null,
      avatarResponse: entry.avatarResponse
        ? {
            mirror: entry.avatarResponse.mirror ?? null,
            patternName: entry.avatarResponse.patternName ?? null,
            integrationStep: entry.avatarResponse.integrationStep ?? null,
          }
        : null,
      generatedPrompt: entry.generatedPrompts?.[0]
        ? {
            title: entry.generatedPrompts[0].title,
            execution: entry.generatedPrompts[0].execution,
            integration: entry.generatedPrompts[0].integration,
          }
        : null,
    })),
  }
}

function serializeDate(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value
}

function buildExcerpt(value: string) {
  const normalized = value.trim().replace(/\s+/g, " ")
  return normalized.length > 160 ? `${normalized.slice(0, 157).trimEnd()}...` : normalized
}
