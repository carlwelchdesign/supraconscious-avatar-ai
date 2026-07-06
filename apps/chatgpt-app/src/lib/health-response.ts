export const HEALTH_RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "X-Content-Type-Options": "nosniff",
} as const

export function buildHealthPayload() {
  return {
    status: "ok",
    service: "inner-avatar-chatgpt-app",
    timestamp: new Date().toISOString(),
  }
}
