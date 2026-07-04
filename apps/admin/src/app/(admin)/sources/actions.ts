"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { canDisplaySourceQuote, evaluateSourceEligibility } from "@inner-avatar/ai"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const SourceStateSchema = z.object({
  sourceDocumentId: z.string().min(1),
  reviewState: z.enum(["imported", "parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]),
  rightsStatus: z.enum(["needs_review", "approved", "paraphrase_only", "blocked"]),
  reason: z.string().trim().min(10, "A review reason is required."),
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
  ownerName: z.string().trim().min(2),
  grantType: z.string().trim().min(2).default("provided_by_owner"),
  allowedUses: z.array(z.string()).min(1),
  quoteAllowed: z.union([z.literal("on"), z.null()]).optional(),
  attributionRequired: z.union([z.literal("on"), z.null()]).optional(),
  attributionText: z.string().trim().optional(),
  status: z.enum(["needs_review", "approved", "paraphrase_only", "revoked", "expired", "blocked"]),
  reason: z.string().trim().min(10, "A rights review reason is required."),
})

export async function updateSourceDocumentStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = SourceStateSchema.parse(Object.fromEntries(formData))
  const approving = ["approved", "approved_curriculum"].includes(parsed.reviewState) ||
    ["approved", "paraphrase_only"].includes(parsed.rightsStatus)

  if (approving) {
    const rightsGrantCount = await prisma.sourceRightsGrant.count({
      where: {
        sourceDocumentId: parsed.sourceDocumentId,
        status: { in: ["approved", "paraphrase_only"] },
      },
    })

    if (rightsGrantCount === 0) {
      throw new Error("Add an approved or paraphrase-only rights grant before approving this source.")
    }
  }

  await prisma.sourceDocument.update({
    where: { id: parsed.sourceDocumentId },
    data: {
      reviewState: parsed.reviewState,
      rightsStatus: parsed.rightsStatus,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_document.review_state.update",
      targetType: "SourceDocument",
      targetId: parsed.sourceDocumentId,
      reason: parsed.reason,
      metadata: {
        reviewState: parsed.reviewState,
        rightsStatus: parsed.rightsStatus,
      },
    },
  })

  revalidatePath("/sources")
}

export async function updateCurriculumDayStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CurriculumStateSchema.parse(Object.fromEntries(formData))

  await prisma.curriculumDay.update({
    where: { id: parsed.curriculumDayId },
    data: { publishState: parsed.publishState },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "curriculum_day.publish_state.update",
      targetType: "CurriculumDay",
      targetId: parsed.curriculumDayId,
      reason: parsed.reason,
      metadata: { publishState: parsed.publishState },
    },
  })

  revalidatePath("/sources")
  revalidatePath("/journal")
}

export async function updateSourceChunkStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ChunkStateSchema.parse(Object.fromEntries(formData))
  const conceptTags = parseCsv(parsed.conceptTags)
  const councilRoleTags = parseCsv(parsed.councilRoleTags)
  const approving = ["approved", "approved_curriculum"].includes(parsed.reviewState)
  const quoteSafe = parsed.quotePermission === "quote_safe"

  if (approving || quoteSafe) {
    const chunk = await prisma.sourceChunk.findUnique({
      where: { id: parsed.sourceChunkId },
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

    if (!chunk) throw new Error("Source chunk not found.")

    const proposedChunk = {
      reviewState: parsed.reviewState,
      quotePermission: parsed.quotePermission,
      safetyIntensity: parsed.safetyIntensity,
    }
    const decision = evaluateSourceEligibility(chunk.sourceDocument, proposedChunk)

    if (approving && !decision.eligible) {
      throw new Error(`Chunk cannot be approved yet: ${decision.reasons.join(", ")}.`)
    }

    if (quoteSafe && !canDisplaySourceQuote(chunk.sourceDocument, proposedChunk)) {
      throw new Error("Quote-safe display requires an approved direct-quote rights grant with quote allowed.")
    }
  }

  await prisma.sourceChunk.update({
    where: { id: parsed.sourceChunkId },
    data: {
      reviewState: parsed.reviewState,
      quotePermission: parsed.quotePermission,
      safetyIntensity: parsed.safetyIntensity,
      conceptTags,
      councilRoleTags,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_chunk.review_state.update",
      targetType: "SourceChunk",
      targetId: parsed.sourceChunkId,
      reason: parsed.reason,
      metadata: {
        reviewState: parsed.reviewState,
        quotePermission: parsed.quotePermission,
        safetyIntensity: parsed.safetyIntensity,
        conceptTags,
        councilRoleTags,
      },
    },
  })

  revalidatePath("/sources")
}

export async function upsertSourceRightsGrantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = RightsGrantSchema.parse({
    ...Object.fromEntries(formData),
    allowedUses: formData.getAll("allowedUses"),
    quoteAllowed: formData.get("quoteAllowed"),
    attributionRequired: formData.get("attributionRequired"),
  })

  const grant = await prisma.sourceRightsGrant.create({
    data: {
      sourceDocumentId: parsed.sourceDocumentId,
      ownerName: parsed.ownerName,
      grantType: parsed.grantType,
      allowedUses: parsed.allowedUses,
      quoteAllowed: parsed.quoteAllowed === "on",
      attributionRequired: parsed.attributionRequired === "on",
      attributionText: parsed.attributionText,
      status: parsed.status,
      reviewerId: actor.id,
      reviewedAt: new Date(),
      reason: parsed.reason,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_rights_grant.create",
      targetType: "SourceRightsGrant",
      targetId: grant.id,
      reason: parsed.reason,
      metadata: {
        sourceDocumentId: parsed.sourceDocumentId,
        status: parsed.status,
        allowedUses: parsed.allowedUses,
        quoteAllowed: parsed.quoteAllowed === "on",
      },
    },
  })

  revalidatePath("/sources")
}

function parseCsv(value: string | undefined) {
  const parsed = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return parsed.length > 0 ? parsed : undefined
}
