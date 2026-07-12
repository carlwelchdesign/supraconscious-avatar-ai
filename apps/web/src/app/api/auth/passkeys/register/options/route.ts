import { requireAppUser } from "@inner-avatar/auth/session"
import { startPasskeyRegistration } from "@inner-avatar/auth/webauthn"
import { privateJson } from "@/lib/private-json"
import { requestOrigin } from "@/lib/request-origin"

export async function POST(request: Request) {
  const user = await requireAppUser()
  const result = await startPasskeyRegistration({
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    origin: requestOrigin(request),
  })

  return privateJson(result)
}
