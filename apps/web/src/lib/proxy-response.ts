export const PROXY_PRIVATE_JSON_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
} as const

export function privateProxyJsonInit(status: number) {
  return {
    status,
    headers: PROXY_PRIVATE_JSON_HEADERS,
  }
}
