import { randomUUID } from "node:crypto"

export const LANGSMITH_METADATA_POLICY_VERSION = "langsmith-metadata-only-v1"

export type LangSmithTraceContext = {
  enabled: boolean
  sampled: boolean
  runId: string | null
  traceId: string | null
  projectName: string
  runUrl: string | null
  metadataOnly: boolean
  policyVersion: string
}

export type LangSmithTraceLink = LangSmithTraceContext & {
  error?: string
}

export type SanitizedLangSmithPayload = {
  metadata: Record<string, unknown>
}

export type LangSmithRunMetadata = Record<string, unknown>

const SENSITIVE_KEY_PATTERNS = [
  /^raw/i,
  /^text$/i,
  /(input|raw|journal|entry|feedback).*text/i,
  /^journalEntry$/i,
  /note/i,
  /^content$/i,
  /chunkText/i,
  /displayExcerpt/i,
  /quoteSafeExcerpt/i,
  /^prompt$/i,
  /promptContent/i,
  /systemPrompt/i,
  /^councilRun$/i,
  /^messages?$/i,
  /^synthesis$/i,
  /^observer$/i,
  /^observerSignal$/i,
]

type LangSmithClientLike = {
  createRun: (run: never) => Promise<void>
  updateRun: (runId: string, run: never) => Promise<void>
}

type LangSmithClientFactory = () => Promise<LangSmithClientLike | null>

let clientFactory: LangSmithClientFactory = createDefaultLangSmithClient

export function isLangSmithEnabled(env: NodeJS.ProcessEnv = process.env) {
  const tracing = env.LANGSMITH_TRACING ?? env.LANGCHAIN_TRACING_V2
  const apiKey = env.LANGSMITH_API_KEY ?? env.LANGCHAIN_API_KEY
  return isTruthy(tracing) && Boolean(apiKey && !apiKey.includes("replace"))
}

export function sanitizeLangSmithMetadata(input: unknown): SanitizedLangSmithPayload {
  return {
    metadata: sanitizeValue(input, "metadata") as Record<string, unknown>,
  }
}

export async function withLangSmithRun<T>(
  name: string,
  metadata: LangSmithRunMetadata,
  fn: (context: LangSmithTraceContext) => Promise<T>,
): Promise<{ value: T; langsmith: LangSmithTraceLink }> {
  const context = buildLangSmithTraceContext()
  const sanitized = sanitizeLangSmithMetadata(metadata).metadata
  const startTime = new Date()

  if (context.enabled && context.sampled && context.runId) {
    void sendLangSmithCreateRun(context, name, startTime, sanitized)
  }

  try {
    const value = await fn(context)
    if (context.enabled && context.sampled && context.runId) {
      void sendLangSmithUpdateRun(context, {
        outputs: { status: "completed", metadata: sanitized },
        end_time: new Date().toISOString(),
      })
    }
    return { value, langsmith: context }
  } catch (error) {
    if (context.enabled && context.sampled && context.runId) {
      void sendLangSmithUpdateRun(context, {
        error: error instanceof Error ? error.message : "Unknown error",
        end_time: new Date().toISOString(),
      })
    }
    throw error
  }
}

export function recordLangSmithEvent(context: LangSmithTraceContext, name: string, metadata: LangSmithRunMetadata = {}) {
  if (!context.enabled || !context.sampled || !context.runId) return
  void sendLangSmithUpdateRun(context, {
    events: [{
      name,
      time: new Date().toISOString(),
      metadata: sanitizeLangSmithMetadata(metadata).metadata,
    }],
  })
}

export function buildLangSmithTraceContext(env: NodeJS.ProcessEnv = process.env): LangSmithTraceContext {
  const enabled = isLangSmithEnabled(env)
  const sampleRate = readSampleRate(env.LANGSMITH_SAMPLE_RATE)
  const sampled = enabled && Math.random() < sampleRate
  const runId = sampled ? randomUUID() : null

  return {
    enabled,
    sampled,
    runId,
    traceId: runId,
    projectName: env.LANGSMITH_PROJECT || env.LANGCHAIN_PROJECT || "inner-avatar-dev",
    runUrl: null,
    metadataOnly: env.LANGSMITH_METADATA_ONLY !== "false",
    policyVersion: LANGSMITH_METADATA_POLICY_VERSION,
  }
}

export function setLangSmithClientFactoryForTests(factory: LangSmithClientFactory) {
  clientFactory = factory
}

export function resetLangSmithClientFactoryForTests() {
  clientFactory = createDefaultLangSmithClient
}

export function buildGenerationTraceLangSmithMetadata(context: LangSmithTraceContext, extra: Record<string, unknown> = {}) {
  return {
    enabled: context.enabled,
    sampled: context.sampled,
    runId: context.runId,
    traceId: context.traceId,
    runUrl: context.runUrl,
    projectName: context.projectName,
    metadataOnly: context.metadataOnly,
    policyVersion: context.policyVersion,
    ...sanitizeLangSmithMetadata(extra).metadata,
  }
}

export async function runLangSmithObservabilityCheck() {
  const disabled = buildLangSmithTraceContext({
    LANGSMITH_TRACING: "false",
    LANGSMITH_API_KEY: "",
  } as unknown as NodeJS.ProcessEnv)
  const sanitized = sanitizeLangSmithMetadata({
    requestId: "check-1",
    inputHash: "hash_123",
    rawText: "private journal",
    feedbackNote: "private feedback",
    sourceContext: [{ id: "chunk_1", title: "Source", chunkText: "private source text" }],
    promptTemplate: { key: "council.system", version: 1, content: "private prompt" },
    validationStatus: "validated",
  }).metadata

  const serialized = JSON.stringify(sanitized)
  const redactionPassed = !serialized.includes("private journal") &&
    !serialized.includes("private feedback") &&
    !serialized.includes("private source text") &&
    !serialized.includes("private prompt") &&
    serialized.includes("[redacted]")

  return {
    passed: disabled.enabled === false && redactionPassed,
    checks: {
      disabledNoop: disabled.enabled === false && disabled.sampled === false && disabled.runId === null,
      redactionPassed,
      safeMetadataPreserved: sanitized.requestId === "check-1" && sanitized.inputHash === "hash_123" && sanitized.validationStatus === "validated",
    },
    policyVersion: LANGSMITH_METADATA_POLICY_VERSION,
  }
}

async function sendLangSmithCreateRun(context: LangSmithTraceContext, name: string, startTime: Date, metadata: Record<string, unknown>) {
  try {
    const client = await clientFactory()
    if (!client || !context.runId) return
    await client.createRun({
      id: context.runId,
      trace_id: context.traceId ?? context.runId,
      name,
      run_type: "chain",
      start_time: startTime.toISOString(),
      inputs: { metadata },
      extra: { metadata: { ...metadata, langsmithPolicyVersion: context.policyVersion } },
      session_name: context.projectName,
      tags: ["inner-avatar", "metadata-only"],
    } as never)
  } catch {
    // LangSmith must never affect user-facing reflection flow.
  }
}

async function sendLangSmithUpdateRun(context: LangSmithTraceContext, update: Record<string, unknown>) {
  try {
    const client = await clientFactory()
    if (!client || !context.runId) return
    await client.updateRun(context.runId, update as never)
  } catch {
    // LangSmith must never affect user-facing reflection flow.
  }
}

async function createDefaultLangSmithClient(): Promise<LangSmithClientLike | null> {
  if (!isLangSmithEnabled()) return null
  const { Client } = await import("langsmith")
  return new Client({
    apiKey: process.env.LANGSMITH_API_KEY ?? process.env.LANGCHAIN_API_KEY,
    apiUrl: process.env.LANGSMITH_ENDPOINT,
  })
}

function sanitizeValue(value: unknown, key: string): unknown {
  if (isSensitiveKey(key)) return "[redacted]"
  if (value === null || value === undefined) return value
  if (value instanceof Date) return value.toISOString()
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, key))
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([childKey, childValue]) => [childKey, sanitizeValue(childValue, childKey)]),
    )
  }
  return value
}

function isSensitiveKey(key: string) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key))
}

function readSampleRate(raw: string | undefined) {
  if (!raw) return 1
  const parsed = Number(raw)
  if (!Number.isFinite(parsed)) return 1
  return Math.max(0, Math.min(1, parsed))
}

function isTruthy(value: string | undefined) {
  return value === "true" || value === "1"
}
