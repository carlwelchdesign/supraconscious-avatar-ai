const LOCAL_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"])

export function normalizeOrigin(value: string | null | undefined) {
  if (!value) return null
  try {
    const url = new URL(value)
    return url.origin
  } catch {
    return null
  }
}

export function resolveConfiguredAppOrigin(value = process.env.NEXT_PUBLIC_APP_URL) {
  return normalizeOrigin(value) ?? "http://localhost:3000"
}

export function resolveFirstPartyAppOrigin({
  requestOrigin,
  requestHost,
  configuredOrigin = process.env.NEXT_PUBLIC_APP_URL,
  nodeEnv = process.env.NODE_ENV,
}: {
  requestOrigin?: string | null
  requestHost?: string | null
  configuredOrigin?: string | null
  nodeEnv?: string
}) {
  const configured = resolveConfiguredAppOrigin(configuredOrigin ?? undefined)
  const normalizedRequestOrigin = normalizeOrigin(requestOrigin)

  if (normalizedRequestOrigin && isAllowedAppOrigin(normalizedRequestOrigin, configured, nodeEnv)) {
    return normalizedRequestOrigin
  }

  const protocol = nodeEnv === "production" ? "https" : "http"
  const hostOrigin = normalizeOrigin(requestHost ? `${protocol}://${requestHost}` : null)
  if (hostOrigin && isAllowedAppOrigin(hostOrigin, configured, nodeEnv)) {
    return hostOrigin
  }

  return configured
}

function isAllowedAppOrigin(candidate: string, configured: string, nodeEnv?: string) {
  if (candidate === configured) return true
  return nodeEnv !== "production" && LOCAL_ORIGINS.has(candidate)
}
