"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireSuperAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const ActivateRagSchema = z.object({
  reason: z.string().trim().min(20, "Explain why RAG is ready to activate."),
  evalReport: z.string().trim().min(10, "Attach a machine-readable eval report JSON."),
})

export async function activateRagAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = ActivateRagSchema.parse({
    reason: formData.get("reason"),
    evalReport: formData.get("evalReport"),
  })
  const readiness = await getRagReadinessCounts()
  const evalReport = parseEvalReport(parsed.evalReport)

  if (!evalReport.passed || !evalReport.rollbackCriteria) {
    throw new Error("RAG activation requires eval report JSON with passed=true and rollbackCriteria.")
  }

  if (readiness.approvedDocuments === 0 || readiness.eligibleChunks === 0) {
    throw new Error("RAG activation requires at least one approved source document and eligible chunk.")
  }

  if (readiness.rightsMissingApprovedChunks > 0) {
    throw new Error("RAG activation is blocked while approved chunks are missing compatible rights coverage.")
  }

  const flag = await prisma.featureFlag.upsert({
    where: { key: "rag_enabled" },
    create: {
      key: "rag_enabled",
      description: "Policy-first RAG activation gate.",
      enabled: true,
      metadata: {
        activatedBy: actor.id,
        activatedAt: new Date().toISOString(),
        evalReport,
        readiness,
      },
    },
    update: {
      enabled: true,
      metadata: {
        activatedBy: actor.id,
        activatedAt: new Date().toISOString(),
        evalReport,
        readiness,
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "rag.activation_gate.enable",
      targetType: "FeatureFlag",
      targetId: flag.id,
      reason: parsed.reason,
      metadata: {
        key: "rag_enabled",
        evalReport,
        readiness,
      },
    },
  })

  revalidatePath("/sources/readiness")
  revalidatePath("/feature-flags")
}

function parseEvalReport(value: string) {
  try {
    const parsed = JSON.parse(value) as { passed?: unknown; rollbackCriteria?: unknown }
    return {
      passed: parsed.passed === true,
      rollbackCriteria: typeof parsed.rollbackCriteria === "string" ? parsed.rollbackCriteria : null,
      raw: parsed,
    }
  } catch {
    throw new Error("Eval report must be valid JSON.")
  }
}

export async function getRagReadinessCounts() {
  const now = new Date()
  const [
    approvedDocuments,
    eligibleChunks,
    quoteSafeChunks,
    blockedOrSensitiveChunks,
    failedImports,
    rightsMissingApprovedChunks,
    recentRetrievalTraces,
    noEligibleSourceTraces,
  ] = await Promise.all([
    prisma.sourceDocument.count({
      where: {
        sourceType: "product_doctrine",
        reviewState: { in: ["approved", "approved_curriculum"] },
        rightsStatus: { in: ["approved", "paraphrase_only"] },
      },
    }),
    prisma.sourceChunk.count({
      where: {
        reviewState: { in: ["approved", "approved_curriculum"] },
        safetyIntensity: { in: ["normal", "gentle"] },
        sourceDocument: {
          sourceType: "product_doctrine",
          reviewState: { in: ["approved", "approved_curriculum"] },
          rightsStatus: { in: ["approved", "paraphrase_only"] },
          rightsGrants: {
            some: {
              status: { in: ["approved", "paraphrase_only"] },
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              allowedUses: { array_contains: ["paraphrase_generation"] },
            },
          },
        },
      },
    }),
    prisma.sourceChunk.count({
      where: {
        quotePermission: "quote_safe",
        sourceDocument: { sourceType: "product_doctrine" },
      },
    }),
    prisma.sourceChunk.count({
      where: {
        OR: [
          { reviewState: "blocked" },
          { safetyIntensity: { in: ["sensitive", "blocked"] } },
          { sourceDocument: { reviewState: { in: ["blocked", "deprecated"] } } },
        ],
      },
    }),
    prisma.sourceImportBatch.count({ where: { failedCount: { gt: 0 } } }),
    prisma.sourceChunk.count({
      where: {
        reviewState: { in: ["approved", "approved_curriculum"] },
        sourceDocument: {
          rightsGrants: {
            none: {
              status: { in: ["approved", "paraphrase_only"] },
              revokedAt: null,
              OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
              allowedUses: { array_contains: ["paraphrase_generation"] },
            },
          },
        },
      },
    }),
    prisma.generationTrace.count({ where: { traceType: "retrieval" } }),
    prisma.generationTrace.count({
      where: {
        traceType: "retrieval",
        validationStatus: "no_eligible_source",
      },
    }),
  ])

  return {
    approvedDocuments,
    eligibleChunks,
    quoteSafeChunks,
    blockedOrSensitiveChunks,
    failedImports,
    rightsMissingApprovedChunks,
    recentRetrievalTraces,
    noEligibleSourceTraces,
  }
}
