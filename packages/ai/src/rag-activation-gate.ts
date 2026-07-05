import { prisma } from "@inner-avatar/db"
import { canDisplaySourceQuote } from "./source-policy.js"

export type RagReadinessCounts = {
  approvedDocuments: number
  eligibleChunks: number
  quoteSafeChunks: number
  blockedOrSensitiveChunks: number
  failedImports: number
  rightsMissingApprovedChunks: number
  recentRetrievalTraces: number
  noEligibleSourceTraces: number
}

export type RagActivationEvalReport = {
  passed: boolean
  rollbackCriteria: string | null
  raw: string
}

export type RagActivationResult = {
  flagId: string
  readiness: RagReadinessCounts
  evalReport: RagActivationEvalReport
}

export function parseRagActivationEvalReport(value: string): RagActivationEvalReport {
  try {
    const parsed = JSON.parse(value) as { passed?: unknown; rollbackCriteria?: unknown }
    return {
      passed: parsed.passed === true,
      rollbackCriteria: typeof parsed.rollbackCriteria === "string" ? parsed.rollbackCriteria : null,
      raw: value,
    }
  } catch {
    throw new Error("Eval report must be valid JSON.")
  }
}

export function readRagActivationMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== "object") {
    return {
      activatedAt: null,
      activatedBy: null,
      evalPassed: false,
      rollbackCriteria: null,
    }
  }

  const record = metadata as {
    activatedAt?: unknown
    activatedBy?: unknown
    evalReport?: unknown
  }
  const evalReport = record.evalReport && typeof record.evalReport === "object"
    ? record.evalReport as { passed?: unknown; rollbackCriteria?: unknown }
    : null

  return {
    activatedAt: typeof record.activatedAt === "string" ? record.activatedAt : null,
    activatedBy: typeof record.activatedBy === "string" ? record.activatedBy : null,
    evalPassed: evalReport?.passed === true,
    rollbackCriteria: typeof evalReport?.rollbackCriteria === "string" ? evalReport.rollbackCriteria : null,
  }
}

export async function activatePolicyFirstRag(input: {
  actorId: string
  reason: string
  evalReportJson: string
}): Promise<RagActivationResult> {
  const readiness = await getRagReadinessCounts()
  const evalReport = parseRagActivationEvalReport(input.evalReportJson)

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
        activatedBy: input.actorId,
        activatedAt: new Date().toISOString(),
        evalReport,
        readiness,
      },
    },
    update: {
      enabled: true,
      metadata: {
        activatedBy: input.actorId,
        activatedAt: new Date().toISOString(),
        evalReport,
        readiness,
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "rag.activation_gate.enable",
      targetType: "FeatureFlag",
      targetId: flag.id,
      reason: input.reason,
      metadata: {
        key: "rag_enabled",
        evalReport,
        readiness,
      },
    },
  })

  return {
    flagId: flag.id,
    readiness,
    evalReport,
  }
}

export async function rollbackPolicyFirstRag(input: {
  actorId: string
  reason: string
}) {
  const flag = await prisma.featureFlag.upsert({
    where: { key: "rag_enabled" },
    create: {
      key: "rag_enabled",
      description: "Policy-first RAG activation gate.",
      enabled: false,
      metadata: {
        rolledBackBy: input.actorId,
        rolledBackAt: new Date().toISOString(),
      },
    },
    update: {
      enabled: false,
      metadata: {
        rolledBackBy: input.actorId,
        rolledBackAt: new Date().toISOString(),
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: input.actorId,
      action: "rag.activation_gate.rollback",
      targetType: "FeatureFlag",
      targetId: flag.id,
      reason: input.reason,
      metadata: { key: "rag_enabled" },
    },
  })

  return { flagId: flag.id }
}

export async function getRagReadinessCounts(): Promise<RagReadinessCounts> {
  const now = new Date()
  const [
    approvedDocuments,
    eligibleChunks,
    quoteSafeChunkCandidates,
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
    prisma.sourceChunk.findMany({
      where: {
        quotePermission: "quote_safe",
        sourceDocument: { sourceType: "product_doctrine" },
      },
      select: {
        reviewState: true,
        quotePermission: true,
        safetyIntensity: true,
        sourceDocument: {
          select: {
            reviewState: true,
            rightsStatus: true,
            rightsGrants: {
              select: {
                status: true,
                allowedUses: true,
                quoteAllowed: true,
                expiresAt: true,
                revokedAt: true,
              },
            },
          },
        },
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
    quoteSafeChunks: quoteSafeChunkCandidates.filter((chunk) =>
      canDisplaySourceQuote(chunk.sourceDocument, chunk, { now })
    ).length,
    blockedOrSensitiveChunks,
    failedImports,
    rightsMissingApprovedChunks,
    recentRetrievalTraces,
    noEligibleSourceTraces,
  }
}
