"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { canDisplaySourceQuote, evaluateSourceEligibility, hasUsableSourceRightsGrant } from "@inner-avatar/ai"
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
  const parsed = SourceStateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/sources?status=source_invalid")

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

    if (!source) redirect("/sources?status=source_missing")

    if (!hasUsableSourceRightsGrant(source, "paraphrase_generation")) {
      redirect("/sources?status=source_rights_missing")
    }
  }

  await prisma.sourceDocument.update({
    where: { id: parsed.data.sourceDocumentId },
    data: {
      reviewState: parsed.data.reviewState,
      rightsStatus: parsed.data.rightsStatus,
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
      },
    },
  })

  revalidatePath("/sources")
  redirect("/sources?status=source_saved")
}

export async function updateCurriculumDayStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CurriculumStateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/sources?status=curriculum_invalid")

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
  redirect("/sources?status=curriculum_saved")
}

export async function updateSourceChunkStateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ChunkStateSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/sources?status=chunk_invalid")

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

    if (!chunk) redirect("/sources?status=chunk_missing")

    const proposedChunk = {
      reviewState: parsed.data.reviewState,
      quotePermission: parsed.data.quotePermission,
      safetyIntensity: parsed.data.safetyIntensity,
    }
    const decision = evaluateSourceEligibility(chunk.sourceDocument, proposedChunk)

    if (approving && !decision.eligible) {
      redirect("/sources?status=chunk_not_eligible")
    }

    if (quoteSafe && !canDisplaySourceQuote(chunk.sourceDocument, proposedChunk)) {
      redirect("/sources?status=chunk_quote_blocked")
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
  redirect("/sources?status=chunk_saved")
}

export async function upsertSourceRightsGrantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = RightsGrantSchema.safeParse({
    ...Object.fromEntries(formData),
    allowedUses: formData.getAll("allowedUses"),
    quoteAllowed: formData.get("quoteAllowed"),
    attributionRequired: formData.get("attributionRequired"),
  })
  if (!parsed.success) redirect("/sources?status=rights_invalid")

  const grant = await prisma.sourceRightsGrant.create({
    data: {
      sourceDocumentId: parsed.data.sourceDocumentId,
      ownerName: parsed.data.ownerName,
      grantType: parsed.data.grantType,
      allowedUses: parsed.data.allowedUses,
      quoteAllowed: parsed.data.quoteAllowed === "on",
      attributionRequired: parsed.data.attributionRequired === "on",
      attributionText: parsed.data.attributionText,
      status: parsed.data.status,
      reviewerId: actor.id,
      reviewedAt: new Date(),
      reason: parsed.data.reason,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "source_rights_grant.create",
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
  redirect("/sources?status=rights_saved")
}

function parseCsv(value: string | undefined) {
  const parsed = (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
  return parsed.length > 0 ? parsed : undefined
}
