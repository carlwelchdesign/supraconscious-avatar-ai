import { z } from "zod"
import { finishPendingPasskeyMfa } from "@inner-avatar/auth/webauthn"
import { privateJson } from "@/lib/private-json"
import { requestOrigin } from "@/lib/request-origin"

const VerifyPasskeyAuthenticationSchema = z.object({
  challengeToken: z.string().min(20),
  response: z.unknown(),
})

export async function POST(request: Request) {
  const body = VerifyPasskeyAuthenticationSchema.parse(await request.json())
  const result = await finishPendingPasskeyMfa({
    challengeToken: body.challengeToken,
    response: body.response as never,
    origin: requestOrigin(request),
  })

  return privateJson(result, { status: result.ok ? 200 : 400 })
}
