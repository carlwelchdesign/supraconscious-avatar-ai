import { z } from "zod"
import { requireAppUser } from "@inner-avatar/auth/session"
import { listPasskeys, removePasskey, renamePasskey } from "@inner-avatar/auth/webauthn"
import { privateJson } from "@/lib/private-json"

const RenameSchema = z.object({
  credentialId: z.string().min(1),
  deviceLabel: z.string().min(1).max(80),
})

const RemoveSchema = z.object({
  credentialId: z.string().min(1),
  recoveryCode: z.string().optional(),
})

export async function GET() {
  const user = await requireAppUser()
  return privateJson({ passkeys: await listPasskeys(user.id) })
}

export async function PATCH(request: Request) {
  const user = await requireAppUser()
  const body = RenameSchema.parse(await request.json())
  const result = await renamePasskey({
    userId: user.id,
    credentialId: body.credentialId,
    deviceLabel: body.deviceLabel,
  })
  return privateJson(result, { status: result.ok ? 200 : 404 })
}

export async function DELETE(request: Request) {
  const user = await requireAppUser()
  const body = RemoveSchema.parse(await request.json())
  const result = await removePasskey({
    userId: user.id,
    credentialId: body.credentialId,
    recoveryCode: body.recoveryCode,
  })
  return privateJson(result, { status: result.ok ? 200 : 400 })
}
