const SAFE_NEXT_PATHS = new Set([
  "/dashboard",
  "/journal",
  "/onboarding",
  "/patterns",
  "/settings",
])

const SAFE_NEXT_PREFIXES = [
  "/journal/",
]

export function readSafeNextPath(value: unknown) {
  if (typeof value !== "string") return ""
  const trimmed = value.trim()
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return ""
  if (trimmed.includes("://")) return ""

  const [path] = trimmed.split(/[?#]/)
  return SAFE_NEXT_PATHS.has(path) || SAFE_NEXT_PREFIXES.some((prefix) => path.startsWith(prefix)) ? trimmed : ""
}

export function choosePostAuthRedirect(defaultRedirect: string, requestedNext: unknown) {
  const safeNext = readSafeNextPath(requestedNext)
  if (!safeNext) return defaultRedirect
  if (defaultRedirect === "/onboarding") return safeNext.startsWith("/onboarding") ? safeNext : defaultRedirect
  return safeNext
}

export function choosePostRegistrationRedirect(requestedNext: unknown) {
  return choosePostAuthRedirect("/onboarding", requestedNext)
}
