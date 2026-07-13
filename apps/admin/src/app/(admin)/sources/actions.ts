"use server"

import { access } from "node:fs/promises"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  ReasoningScopeSchema,
  canDisplaySourceQuote,
  createSourceSectionWithChunks,
  evaluateSourceEligibility,
  extractDocxParagraphs,
  hasUsableSourceRightsGrant,
} from "@inner-avatar/ai"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const SourceStateSchema = z.object({
  sourceDocumentId: z.string().min(1),
  reviewState: z.enum(["imported", "parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]),
  rightsStatus: z.enum(["needs_review", "approved", "paraphrase_only", "blocked"]),
  reasoningScope: ReasoningScopeSchema,
  reason: z.string().trim().min(10, "A review reason is required."),
})

const ParseSourceDocumentSchema = z.object({
  sourceDocumentId: z.string().min(1),
  reason: z.string().trim().min(10, "A parsing reason is required."),
})

const CurriculumStateSchema = z.object({
  curriculumDayId: z.string().min(1),
  publishState: z.enum(["needs_review", "approved_curriculum", "deprecated", "blocked"]),
  reason: z.string().trim().min(10, "A review reason is required."),
})

const ChunkStateSchema = z.object({
  sourceChunkId: z.string().min(1),
  reviewState: z.enum(["parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]),
  quotePermission: z.enum(["none", "paraphrase_only", "quote_safe"]),
  safetyIntensity: z.enum(["normal", "gentle", "sensitive", "blocked"]),
  conceptTags: z.string().trim().optional(),
  councilRoleTags: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A review reason is required."),
})

const RightsGrantSchema = z.object({
  sourceDocumentId: z.string().min(1),
  sourceRightsGrantId: z.string().trim().optional(),
  ownerName: z.string().trim().min(2),
  grantType: z.string().trim().min(2).default("provided_by_owner"),
  allowedUses: z.array(z.string()).min(1),
  quoteAllowed: z.union([z.literal("on"), z.null()]).optional(),
  attributionRequired: z.union([z.literal("on"), z.null()]).optional(),
  attributionText: z.string().trim().optional(),
  status: z.enum(["needs_review", "approved", "paraphrase_only", "revoked", "expired", "blocked"]),
  createNewGrant: z.union([z.literal("true"), z.null()]).optional(),
  reason: z.string().trim().min(10, "A rights review reason is required."),
})

const SourceBulkActionSchema = z.object({
  sourceDocumentId: z.string().min(1),
  reason: z.string().trim().min(10, "A review reason is required."),
})

export async function updateSourceDocumentStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = SourceStateSchema.safeParse(Object.fromEntries(formData))
  const sourceDocumentId = readFormId(formData, "sourceDocumentId")
  if (!parsed.success) redirect(sourceActionHref("source_invalid", sourceDocumentId))

  const approving = ["approved", "approved_curriculum"].includes(parsed.data.reviewState) ||
    ["approved", "paraphrase_only"].includes(parsed.data.rightsStatus)

  if (approving) {
    const source = await prisma.sourceDocument.findUnique({
      where: { id: parsed.data.sourceDocumentId },
      select: {
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
    })

    if (!source) redirect(sourceActionHref("source_missing", parsed.data.sourceDocumentId))

    if (!hasUsableSourceRightsGrant(source, "paraphrase_generation")) {
      redirect(sourceActionHref("source_rights_missing", parsed.data.sourceDocumentId))
    }
  }

  await prisma.sourceDocument.update({
    where: { id: parsed.data.sourceDocumentId },
    data: {
      reviewState: parsed.data.reviewState,
      rightsStatus: parsed.data.rightsStatus,
      reasoningScope: parsed.data.reasoningScope,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_document.review_state.update",
      targetType: "SourceDocument",
      targetId: parsed.data.sourceDocumentId,
      reason: parsed.data.reason,
      metadata: {
        reviewState: parsed.data.reviewState,
        rightsStatus: parsed.data.rightsStatus,
        reasoningScope: parsed.data.reasoningScope,
      },
    },
  })

  revalidatePath("/sources")
  redirect(sourceActionHref("source_saved", parsed.data.sourceDocumentId))
}

export async function parseSourceDocumentAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ParseSourceDocumentSchema.safeParse(Object.fromEntries(formData))
  const sourceDocumentId = readFormId(formData, "sourceDocumentId")
  if (!parsed.success) redirect(sourceActionHref("source_parse_invalid", sourceDocumentId))

  const source = await prisma.sourceDocument.findUnique({
    where: { id: parsed.data.sourceDocumentId },
    select: {
      id: true,
      title: true,
      sourceType: true,
      filePath: true,
      metadata: true,
      _count: { select: { chunks: true, sections: true } },
    },
  })

  if (!source) redirect(sourceActionHref("source_missing", parsed.data.sourceDocumentId))
  if (!source.filePath || !source.filePath.toLowerCase().endsWith(".docx")) {
    redirect(sourceActionHref("source_parse_unsupported", source.id))
  }
  if (source._count.chunks > 0 || source._count.sections > 0) {
    redirect(sourceActionHref("source_parse_exists", source.id))
  }

  let paragraphs: string[]
  try {
    await access(source.filePath)
    paragraphs = await extractDocxParagraphs(source.filePath)
  } catch {
    redirect(sourceActionHref("source_parse_failed", source.id))
  }

  const canonicalText = paragraphs.join("\n").trim()
  if (!canonicalText) redirect(sourceActionHref("source_parse_empty", source.id))

  try {
    await createSourceSectionWithChunks(
      source.id,
      {
        headingPath: [source.title],
        sectionType: source.sourceType,
        paragraphStart: 1,
        paragraphEnd: paragraphs.length,
        canonicalText,
        reviewState: "parsed",
      },
      2200,
    )

    await prisma.sourceDocument.update({
      where: { id: source.id },
      data: {
        reviewState: "parsed",
        metadata: {
          ...(isRecord(source.metadata) ? source.metadata : {}),
          parsedBy: "admin.parseSourceDocumentAction",
          parsedAt: new Date().toISOString(),
          paragraphCount: paragraphs.length,
        },
      },
    })

    await prisma.auditLog.create({
      data: {
        actorId: actor.id,
        action: "source_document.parse_chunks",
        targetType: "SourceDocument",
        targetId: source.id,
        reason: parsed.data.reason,
        metadata: {
          sourceType: source.sourceType,
          filePath: source.filePath,
          paragraphCount: paragraphs.length,
        },
      },
    })
  } catch {
    redirect(sourceActionHref("source_parse_failed", source.id))
  }

  revalidatePath("/sources")
  redirect(sourceActionHref("source_parsed", source.id))
}

export async function updateCurriculumDayStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CurriculumStateSchema.safeParse(Object.fromEntries(formData))
  const redirectHref = curriculumActionHref(
    parsed.success ? "curriculum_saved" : "curriculum_invalid",
    readFormString(formData, "month"),
    readFormString(formData, "publishStateFilter"),
    readFormString(formData, "limit"),
  )
  if (!parsed.success) redirect(redirectHref)

  await prisma.curriculumDay.update({
    where: { id: parsed.data.curriculumDayId },
    data: { publishState: parsed.data.publishState },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "curriculum_day.publish_state.update",
      targetType: "CurriculumDay",
      targetId: parsed.data.curriculumDayId,
      reason: parsed.data.reason,
      metadata: { publishState: parsed.data.publishState },
    },
  })

  revalidatePath("/sources")
  revalidatePath("/journal")
  redirect(redirectHref)
}

export async function updateSourceChunkStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ChunkStateSchema.safeParse(Object.fromEntries(formData))
  const sourceChunkId = readFormId(formData, "sourceChunkId")
  if (!parsed.success) redirect(sourceChunkActionHref("chunk_invalid", sourceChunkId))

  const conceptTags = parseCsv(parsed.data.conceptTags)
  const councilRoleTags = parseCsv(parsed.data.councilRoleTags)
  const approving = ["approved", "approved_curriculum"].includes(parsed.data.reviewState)
  const quoteSafe = parsed.data.quotePermission === "quote_safe"

  if (approving || quoteSafe) {
    const chunk = await prisma.sourceChunk.findUnique({
      where: { id: parsed.data.sourceChunkId },
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
    })

    if (!chunk) redirect(sourceChunkActionHref("chunk_missing", parsed.data.sourceChunkId))

    const proposedChunk = {
      reviewState: parsed.data.reviewState,
      quotePermission: parsed.data.quotePermission,
      safetyIntensity: parsed.data.safetyIntensity,
    }
    const decision = evaluateSourceEligibility(chunk.sourceDocument, proposedChunk)

    if (approving && !decision.eligible) {
      redirect(sourceChunkActionHref("chunk_not_eligible", parsed.data.sourceChunkId))
    }

    if (quoteSafe && !canDisplaySourceQuote(chunk.sourceDocument, proposedChunk)) {
      redirect(sourceChunkActionHref("chunk_quote_blocked", parsed.data.sourceChunkId))
    }
  }

  await prisma.sourceChunk.update({
    where: { id: parsed.data.sourceChunkId },
    data: {
      reviewState: parsed.data.reviewState,
      quotePermission: parsed.data.quotePermission,
      safetyIntensity: parsed.data.safetyIntensity,
      conceptTags,
      councilRoleTags,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_chunk.review_state.update",
      targetType: "SourceChunk",
      targetId: parsed.data.sourceChunkId,
      reason: parsed.data.reason,
      metadata: {
        reviewState: parsed.data.reviewState,
        quotePermission: parsed.data.quotePermission,
        safetyIntensity: parsed.data.safetyIntensity,
        conceptTags,
        councilRoleTags,
      },
    },
  })

  revalidatePath("/sources")
  redirect(sourceChunkActionHref("chunk_saved", parsed.data.sourceChunkId))
}

export async function approveSourceForInternalRagAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = SourceBulkActionSchema.safeParse(Object.fromEntries(formData))
  const sourceDocumentId = readFormId(formData, "sourceDocumentId")
  if (!parsed.success) redirect(sourceActionHref("source_rag_invalid", sourceDocumentId))

  const source = await prisma.sourceDocument.findUnique({
    where: { id: parsed.data.sourceDocumentId },
    select: {
      id: true,
      author: true,
      rightsGrants: {
        orderBy: { createdAt: "desc" },
        select: { id: true, ownerName: true, grantType: true, status: true, revokedAt: true, expiresAt: true },
      },
    },
  })
  if (!source) redirect(sourceActionHref("source_missing", parsed.data.sourceDocumentId))

  const currentGrant = source.rightsGrants.find((grant) => isEditableRightsGrantStatus(grant.status))

  await prisma.$transaction(async (tx) => {
    const grant = currentGrant
      ? await tx.sourceRightsGrant.update({
          where: { id: currentGrant.id },
          data: {
            ownerName: currentGrant.ownerName || source.author || "Maria Olon Tsaroucha",
            grantType: currentGrant.grantType || "provided_by_owner",
            allowedUses: ["internal_retrieval", "paraphrase_generation"],
            quoteAllowed: false,
            attributionRequired: false,
            attributionText: null,
            status: "paraphrase_only",
            reviewerId: actor.id,
            reviewedAt: new Date(),
            reason: parsed.data.reason,
          },
          select: { id: true },
        })
      : await tx.sourceRightsGrant.create({
          data: {
            sourceDocumentId: source.id,
            ownerName: source.author || "Maria Olon Tsaroucha",
            grantType: "provided_by_owner",
            allowedUses: ["internal_retrieval", "paraphrase_generation"],
            quoteAllowed: false,
            attributionRequired: false,
            status: "paraphrase_only",
            reviewerId: actor.id,
            reviewedAt: new Date(),
            reason: parsed.data.reason,
          },
          select: { id: true },
        })

    await tx.sourceDocument.update({
      where: { id: source.id },
      data: { reviewState: "approved", rightsStatus: "paraphrase_only" },
    })

    await tx.auditLog.create({
      data: {
        actorId: actor.id,
        action: "source_document.approve_internal_rag",
        targetType: "SourceDocument",
        targetId: source.id,
        reason: parsed.data.reason,
        metadata: {
          sourceRightsGrantId: grant.id,
          reviewState: "approved",
          rightsStatus: "paraphrase_only",
          allowedUses: ["internal_retrieval", "paraphrase_generation"],
        },
      },
    })
  })

  revalidatePath("/sources")
  redirect(sourceActionHref("source_rag_approved", parsed.data.sourceDocumentId))
}

export async function approveParsedSourceChunksAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = SourceBulkActionSchema.safeParse(Object.fromEntries(formData))
  const sourceDocumentId = readFormId(formData, "sourceDocumentId")
  if (!parsed.success) redirect(sourceActionHref("source_chunks_invalid", sourceDocumentId))

  const source = await prisma.sourceDocument.findUnique({
    where: { id: parsed.data.sourceDocumentId },
    select: {
      id: true,
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
  })
  if (!source) redirect(sourceActionHref("source_missing", parsed.data.sourceDocumentId))
  if (!["approved", "approved_curriculum"].includes(source.reviewState) ||
    !["approved", "paraphrase_only"].includes(source.rightsStatus) ||
    !hasUsableSourceRightsGrant(source, "paraphrase_generation")) {
    redirect(sourceActionHref("source_chunks_source_not_ready", source.id))
  }

  const result = await prisma.sourceChunk.updateMany({
    where: {
      sourceDocumentId: source.id,
      reviewState: "parsed",
      safetyIntensity: { not: "blocked" },
    },
    data: {
      reviewState: "approved",
      quotePermission: "paraphrase_only",
      safetyIntensity: "normal",
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_document.approve_parsed_chunks",
      targetType: "SourceDocument",
      targetId: source.id,
      reason: parsed.data.reason,
      metadata: {
        updatedChunkCount: result.count,
        reviewState: "approved",
        quotePermission: "paraphrase_only",
        safetyIntensity: "normal",
      },
    },
  })

  revalidatePath("/sources")
  redirect(sourceActionHref("source_chunks_approved", source.id))
}

export async function saveSourceRightsGrantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const sourceDocumentId = readFormId(formData, "sourceDocumentId")
  const parsed = RightsGrantSchema.safeParse({
    ...Object.fromEntries(formData),
    allowedUses: formData.getAll("allowedUses"),
    quoteAllowed: formData.get("quoteAllowed"),
    attributionRequired: formData.get("attributionRequired"),
  })
  if (!parsed.success) redirect(sourceActionHref("rights_invalid", sourceDocumentId))

  const requestedGrantId = parsed.data.sourceRightsGrantId || null
  if (!requestedGrantId && parsed.data.createNewGrant !== "true") {
    const activeGrant = await prisma.sourceRightsGrant.findFirst({
      where: {
        sourceDocumentId: parsed.data.sourceDocumentId,
        status: { notIn: ["revoked", "expired", "blocked"] },
      },
      select: { id: true },
    })
    if (activeGrant) redirect(sourceActionHref("rights_duplicate", parsed.data.sourceDocumentId))
  }

  if (requestedGrantId) {
    const existing = await prisma.sourceRightsGrant.findUnique({
      where: { id: requestedGrantId },
      select: { id: true, sourceDocumentId: true },
    })
    if (!existing || existing.sourceDocumentId !== parsed.data.sourceDocumentId) {
      redirect(sourceActionHref("rights_missing", parsed.data.sourceDocumentId))
    }
  }

  const grant = requestedGrantId ? await prisma.sourceRightsGrant.update({
    where: { id: requestedGrantId },
    data: buildRightsGrantData(parsed.data, actor.id),
    select: { id: true },
  }) : await prisma.sourceRightsGrant.create({
    data: {
      sourceDocumentId: parsed.data.sourceDocumentId,
      ...buildRightsGrantData(parsed.data, actor.id),
    },
    select: { id: true },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: requestedGrantId ? "source_rights_grant.update" : "source_rights_grant.create",
      targetType: "SourceRightsGrant",
      targetId: grant.id,
      reason: parsed.data.reason,
      metadata: {
        sourceDocumentId: parsed.data.sourceDocumentId,
        status: parsed.data.status,
        allowedUses: parsed.data.allowedUses,
        quoteAllowed: parsed.data.quoteAllowed === "on",
      },
    },
  })

  revalidatePath("/sources")
  redirect(sourceActionHref("rights_saved", parsed.data.sourceDocumentId))
}

function buildRightsGrantData(
  input: z.infer<typeof RightsGrantSchema>,
  reviewerId: string,
) {
  return {
    ownerName: input.ownerName,
    grantType: input.grantType,
    allowedUses: input.allowedUses,
    quoteAllowed: input.quoteAllowed === "on",
    attributionRequired: input.attributionRequired === "on",
    attributionText: input.attributionText || null,
    status: input.status,
    reviewerId,
    reviewedAt: new Date(),
    reason: input.reason,
  }
}

function parseCsv(value: string | undefined) {
  const parsed = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return parsed.length > 0 ? parsed : undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function isEditableRightsGrantStatus(status: string) {
  return !["revoked", "expired", "blocked"].includes(status)
}

function readFormId(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" && value ? value : undefined
}

function readFormString(formData: FormData, key: string) {
  const value = formData.get(key)
  return typeof value === "string" && value ? value : undefined
}

function sourceActionHref(actionStatus: string, sourceDocumentId?: string) {
  return `/sources?actionStatus=${encodeURIComponent(actionStatus)}${sourceDocumentId ? `#source-${encodeURIComponent(sourceDocumentId)}` : ""}`
}

function sourceChunkActionHref(actionStatus: string, sourceChunkId?: string) {
  return `/sources?actionStatus=${encodeURIComponent(actionStatus)}${sourceChunkId ? `#chunk-${encodeURIComponent(sourceChunkId)}` : "#chunk-review"}`
}

function curriculumActionHref(actionStatus: string, month?: string, publishState?: string, limit?: string) {
  const params = new URLSearchParams({ actionStatus })
  if (isAllowedMonthFilter(month)) params.set("month", month)
  if (isAllowedPublishStateFilter(publishState)) params.set("publishState", publishState)
  if (isAllowedLimitFilter(limit)) params.set("limit", limit)
  return `/sources?${params.toString()}#curriculum-preview`
}

function isAllowedMonthFilter(value: string | undefined): value is string {
  if (!value) return false
  if (value === "all") return true
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12
}

function isAllowedPublishStateFilter(value: string | undefined): value is string {
  return ["all", "needs_review", "approved_curriculum", "deprecated", "blocked"].includes(value ?? "")
}

function isAllowedLimitFilter(value: string | undefined): value is string {
  return ["40", "100", "all"].includes(value ?? "")
}
