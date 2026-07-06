import { readSafeNextPath } from "@inner-avatar/auth/safe-redirect"

export function buildOnboardingPath(nextPath: string) {
  const safeNext = readSafeNextPath(nextPath)
  if (!safeNext) return "/onboarding"

  const params = new URLSearchParams({ next: safeNext })
  return `/onboarding?${params.toString()}`
}

export function buildOnboardingLoginRedirect(nextPath: string) {
  const params = new URLSearchParams({ next: buildOnboardingPath(nextPath) })
  return `/login?${params.toString()}`
}
