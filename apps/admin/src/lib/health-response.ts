export const HEALTH_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const

export function buildHealthPayload(service: string, database: "ok" | "error") {
  return {
    ok: database === "ok",
    service,
    database,
  }
}
