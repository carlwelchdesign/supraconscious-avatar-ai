import { createHash } from "node:crypto"
import { prisma } from "@inner-avatar/db"

export const PILOT_EVENT_NAMES = [
  "journal_submitted",
  "safety_classified",
  "rag_retrieved",
  "council_run_started",
  "council_response_finalized",
  "embodiment_gate_saved",
  "memory_updated",
  "user_feedback_submitted",
  "consent_accepted",
  "data_export_requested",
  "journal_entry_deleted",
  "pattern_memory_cleared",
  "session_revoked",
  "account_deletion_requested",
] as const

export type PilotEventName = typeof PILOT_EVENT_NAMES[number]

export type PilotEventInput = {
  eventName: PilotEventName
  userId?: string | null
  journalEntryId?: string | null
  councilSessionId?: string | null
  properties?: Record<string, string | number | boolean | null | string[]>
  inputText?: string | null
  sourceMode?: string | null
  safetySeverity?: string | null
  featureFlags?: Record<string, boolean>
  requestId?: string | null
}

const FORBIDDEN_PROPERTY_KEYS = new Set([
  "audio",
  "content",
  "entry",
  "feedbacknote",
  "inputtext",
  "journaltext",
  "message",
  "note",
  "rawtext",
  "text",
  "transcript",
])

export async function emitPilotEvent(input: PilotEventInput) {
  return prisma.pilotEvent.create({
    data: {
      userId: input.userId ?? null,
      journalEntryId: input.journalEntryId ?? null,
      councilSessionId: input.councilSessionId ?? null,
      eventName: input.eventName,
      properties: sanitizeProperties(input.properties),
      inputHash: input.inputText ? hashPilotInput(input.inputText) : null,
      sourceMode: input.sourceMode ?? null,
      safetySeverity: input.safetySeverity ?? null,
      featureFlags: input.featureFlags ?? undefined,
      requestId: input.requestId ?? null,
    },
  })
}

export function hashPilotInput(value: string) {
  return createHash("sha256").update(value).digest("hex")
}

export function sanitizeProperties(properties: PilotEventInput["properties"]) {
  if (!properties) return undefined
  const safe: Record<string, string | number | boolean | null | string[]> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (FORBIDDEN_PROPERTY_KEYS.has(normalizePropertyKey(key))) continue
    if (typeof value === "string" && value.length > 500) {
      safe[key] = value.slice(0, 500)
      continue
    }
    safe[key] = value
  }
  return safe
}

function normalizePropertyKey(key: string) {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "")
}
