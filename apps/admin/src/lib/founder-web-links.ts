const FOUNDER_WEB_PATHS = new Set(["/register", "/login", "/onboarding", "/journal"])
const PROTECTED_FOUNDER_WEB_PATHS = new Set(["/onboarding", "/journal"])

export function resolveFounderWebHref(href: string, webAppBaseUrl: string, email?: string | null) {
  if (href.startsWith("http://") || href.startsWith("https://")) return href
  if (!isFounderWebPath(href)) return href

  if (email && isProtectedFounderWebPath(href)) {
    return `${webAppBaseUrl}/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(buildProtectedFounderNextPath(href))}`
  }

  const suffix = email && (href === "/register" || href === "/login") ? `?email=${encodeURIComponent(email)}` : ""
  return `${webAppBaseUrl}${href}${suffix}`
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
