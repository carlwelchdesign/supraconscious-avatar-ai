export function resolveAccountEmailBaseUrl(input: {
  innerAvatarWebUrl?: string | null
  nextPublicAppUrl?: string | null
  forwardedHost?: string | null
  host?: string | null
  forwardedProto?: string | null
} = {}) {
  const configured = normalizeBaseUrl(input.innerAvatarWebUrl) ?? normalizeBaseUrl(input.nextPublicAppUrl)
  if (configured) return configured

  const host = input.forwardedHost ?? input.host
  if (host) return `${input.forwardedProto ?? "http"}://${host}`

  return "http://localhost:3000"
}

function normalizeBaseUrl(value?: string | null) {
  const normalized = value?.trim().replace(/\/+$/, "")
  return normalized || null
}
