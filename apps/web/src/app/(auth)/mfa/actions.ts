"use server"

import { redirect } from "next/navigation"
import { z } from "zod"
import { getTranslations } from "next-intl/server"
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
  const t = await getTranslations("auth")
  const parsed = RecoveryCodeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: t("enterRecoveryCode") }

  const result = await finishPendingMfaWithRecoveryCode(parsed.data.code)
  if (!result.ok) return { error: result.error }

  redirect(result.redirectTo)
}
