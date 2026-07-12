"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { finishPendingMfaWithRecoveryCode } from "@inner-avatar/auth/webauthn"

const RecoveryCodeSchema = z.object({
  code: z.string().trim().min(8),
})

export type MfaRecoveryState = {
  error?: string
}

export async function verifyRecoveryCodeAction(
  _state: MfaRecoveryState,
  formData: FormData,
): Promise<MfaRecoveryState> {
  const parsed = RecoveryCodeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: "Enter a recovery code." }

  const result = await finishPendingMfaWithRecoveryCode(parsed.data.code)
  if (!result.ok) return { error: result.error }

  redirect(result.redirectTo)
}
