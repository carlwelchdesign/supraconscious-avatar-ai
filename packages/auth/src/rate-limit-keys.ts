import { hashAccountEmailForAudit } from "./account-audit"
import type { AuthRateLimitScope } from "./rate-limit"

export function buildAuthRateLimitEmailKey(scope: AuthRateLimitScope, email: string) {
  return `${scope}:email_hash:${hashAccountEmailForAudit(email)}`
}
