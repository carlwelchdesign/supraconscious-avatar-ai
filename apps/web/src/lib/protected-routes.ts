const protectedRoutePrefixes = [
  "/dashboard",
  "/journal",
  "/patterns",
  "/guide",
  "/avatar",
  "/settings",
  "/api/journal",
  "/api/avatar",
  "/api/prompts",
  "/api/patterns",
  "/api/voice",
]

export function isProtectedAppPath(pathname: string) {
  return protectedRoutePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
}
