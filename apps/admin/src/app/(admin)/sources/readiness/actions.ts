"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireSuperAdminUser } from "@inner-avatar/auth/session"
import {
  activatePolicyFirstRag,
  getRagReadinessCounts,
  rollbackPolicyFirstRag,
} from "@inner-avatar/ai"

const ActivateRagSchema = z.object({
  reason: z.string().trim().min(20, "Explain why RAG is ready to activate."),
  evalReport: z.string().trim().min(10, "Attach a machine-readable eval report JSON."),
})

const RollbackRagSchema = z.object({
  reason: z.string().trim().min(20, "Explain why RAG is being disabled."),
})

export async function activateRagAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = ActivateRagSchema.parse({
    reason: formData.get("reason"),
    evalReport: formData.get("evalReport"),
  })

  await activatePolicyFirstRag({
    actorId: actor.id,
    reason: parsed.reason,
    evalReportJson: parsed.evalReport,
  })

  revalidatePath("/sources/readiness")
  revalidatePath("/pilot")
  revalidatePath("/feature-flags")
}

export async function rollbackRagAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = RollbackRagSchema.parse({
    reason: formData.get("reason"),
  })

  await rollbackPolicyFirstRag({
    actorId: actor.id,
    reason: parsed.reason,
  })

  revalidatePath("/sources/readiness")
  revalidatePath("/pilot")
  revalidatePath("/feature-flags")
}

export { getRagReadinessCounts }
