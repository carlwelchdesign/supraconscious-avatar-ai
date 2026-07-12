import { z } from "zod"
import { requireAppUser } from "@inner-avatar/auth/session"
import { finishPasskeyRegistration } from "@inner-avatar/auth/webauthn"
import { privateJson } from "@/lib/private-json"
import { requestOrigin } from "@/lib/request-origin"

const VerifyPasskeyRegistrationSchema = z.object({
  challengeToken: z.string().min(20),
  response: z.unknown(),
  deviceLabel: z.string().optional(),
})

export async function POST(request: Request) {
  const user = await requireAppUser()
  const body = VerifyPasskeyRegistrationSchema.parse(await request.json())
  const result = await finishPasskeyRegistration({
    userId: user.id,
    challengeToken: body.challengeToken,
    response: body.response as never,
    origin: requestOrigin(request),
    deviceLabel: body.deviceLabel,
  })

  return privateJson(result, { status: result.ok ? 200 : 400 })
}
