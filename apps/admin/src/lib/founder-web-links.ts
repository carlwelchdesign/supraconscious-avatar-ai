const FOUNDER_WEB_PATHS = new Set(["/register", "/login", "/onboarding", "/journal"])
const PROTECTED_FOUNDER_WEB_PATHS = new Set(["/onboarding", "/journal"])
const FOUNDER_ADMIN_PATHS = new Set(["/calibration/live", "/calibration/setup"])

export function resolveFounderWebHref(href: string, webAppBaseUrl: string, email?: string | null) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  if (!isFounderWebPath(href)) return href

  if (email && isProtectedFounderWebPath(href)) {
    return `${webAppBaseUrl}/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(buildProtectedFounderNextPath(href))}`
  }

  const suffix = email && (href === "/register" || href === "/login") ? `?email=${encodeURIComponent(email)}` : ""
  return `${webAppBaseUrl}${href}${suffix}`
}

export function resolveFounderHandoffHref(
  href: string | null,
  webAppBaseUrl: string,
  email?: string | null,
  adminAppBaseUrl?: string,
) {
  if (!href) return null
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  if (adminAppBaseUrl && FOUNDER_ADMIN_PATHS.has(href)) return `${adminAppBaseUrl}${href}`
  return resolveFounderWebHref(href, webAppBaseUrl, email)
}

export function resolveFounderHandoffText(
  text: string,
  webAppBaseUrl: string,
  email?: string | null,
  adminAppBaseUrl?: string,
) {
  return text.replace(/(^|[\s:])\/(register|login|onboarding|journal(?:\/[A-Za-z0-9_-]+)?|calibration\/live|calibration\/setup)(?=$|[\s.,)])/g, (_match, prefix: string, path: string) => {
    const href = `/${path}`
    return `${prefix}${resolveFounderHandoffHref(href, webAppBaseUrl, email, adminAppBaseUrl) ?? href}`
  })
}

function isFounderWebPath(href: string) {
  return FOUNDER_WEB_PATHS.has(href) || href.startsWith("/journal/")
}

function isProtectedFounderWebPath(href: string) {
  return PROTECTED_FOUNDER_WEB_PATHS.has(href) || href.startsWith("/journal/")
}

function buildProtectedFounderNextPath(href: string) {
  if (href === "/onboarding") return `/onboarding?next=${encodeURIComponent("/journal")}`
  return href
}
