import { readPendingAuthChallenge } from "@inner-avatar/auth/pending-auth"
import { startPasskeyAuthentication } from "@inner-avatar/auth/webauthn"
import type { SessionScope } from "@inner-avatar/types"
import { privateJson } from "@/lib/private-json"
import { requestOrigin } from "@/lib/request-origin"

export async function POST(request: Request) {
  const pending = await readPendingAuthChallenge({ type: "mfa" })
  if (!pending?.userId) return privateJson({ error: "MFA challenge expired." }, { status: 401 })

  const result = await startPasskeyAuthentication({
    userId: pending.userId,
    origin: requestOrigin(request),
    scope: pending.scope as SessionScope,
  })

  return privateJson(result)
}
