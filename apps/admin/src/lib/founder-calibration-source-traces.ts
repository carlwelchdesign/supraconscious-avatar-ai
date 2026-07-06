export type FounderCalibrationTraceInput = {
  traceType: string
  validationStatus: string
  fallbackReason: string | null
  sourceChunkId: string | null
  outputJson: unknown
  sourceChunk?: {
    sourceDocument?: {
      title: string
    } | null
  } | null
}

export type FounderCalibrationSourceTraceSummary = {
  selectedSources: Array<{
    chunkId: string
    title: string
    rank: number | null
    score: number | null
    matchReason: string | null
    displayExcerptSuppressed: boolean
  }>
  fallbackReasons: string[]
  validationIssues: string[]
}

export function summarizeFounderCalibrationSourceTraces(
  traces: FounderCalibrationTraceInput[],
): FounderCalibrationSourceTraceSummary {
  const selectedSources = traces
    .filter((trace) => trace.traceType === "retrieval" && trace.sourceChunkId)
    .map((trace) => {
      const output = readObject(trace.outputJson)
      const displayExcerpt = typeof output.displayExcerpt === "string" ? output.displayExcerpt.trim() : ""
      return {
        chunkId: trace.sourceChunkId!,
        title: readString(output.title) ?? trace.sourceChunk?.sourceDocument?.title ?? "Untitled source",
        rank: readNumber(output.rank),
        score: readNumber(output.score),
        matchReason: readString(output.matchReason),
        displayExcerptSuppressed: !displayExcerpt,
      }
    })

  const fallbackReasons = traces
    .filter((trace) => trace.traceType === "retrieval" && !trace.sourceChunkId)
    .map((trace) => trace.fallbackReason ?? readString(readObject(trace.outputJson).fallbackReason))
    .filter((reason): reason is string => Boolean(reason))

  const validationIssues = traces
    .filter((trace) => trace.traceType === "council")
    .flatMap((trace) => readCouncilValidationIssues(trace.outputJson))

  return {
    selectedSources,
    fallbackReasons: Array.from(new Set(fallbackReasons)),
    validationIssues: Array.from(new Set(validationIssues)),
  }
}

function readCouncilValidationIssues(value: unknown) {
  const output = readObject(value)
  const pilotValidation = readObject(output.pilotValidation)
  return [
    ...readStringArray(pilotValidation.failedRules),
    ...readStringArray(pilotValidation.warnings),
  ]
}

function readObject(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {}
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function readStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : []
}
