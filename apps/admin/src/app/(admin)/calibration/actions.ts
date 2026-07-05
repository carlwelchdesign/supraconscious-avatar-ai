"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { Prisma } from "@prisma/client"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import {
  FOUNDER_CALIBRATION_PARTICIPANT_ROLES,
  normalizeFounderCalibrationEmail,
  resolveFounderCalibrationUserFilter,
  setupFounderCalibrationParticipants,
} from "@inner-avatar/ai"

const CalibrationReviewSchema = z.object({
  councilSessionId: z.string().min(1),
  label: z.enum(["voice_good", "voice_wrong", "source_good", "source_unsupported", "too_generic", "too_intense", "embodiment_weak", "prompt_regression", "ready"]),
  calibrationIssueType: z.enum(["none", "voice_mismatch", "source_issue", "prompt_issue", "product_copy_issue", "embodiment_weak"]).default("none"),
  severity: z.enum(["normal", "pilot_blocker"]).default("normal"),
  reason: z.string().trim().min(10, "A calibration review reason is required."),
  relatedPromptVersion: z.string().trim().optional(),
  relatedGoldenExampleId: z.string().trim().optional(),
})

const FounderParticipantSchema = z.object({
  email: z.string().trim().email().transform(normalizeFounderCalibrationEmail),
  participantRole: z.enum(FOUNDER_CALIBRATION_PARTICIPANT_ROLES).default("other_founder"),
  reason: z.string().trim().min(10, "A founder participant reason is required."),
})

const FounderParticipantStatusSchema = z.object({
  id: z.string().min(1),
  reason: z.string().trim().min(10, "A founder participant reason is required."),
})

const FounderPairSetupSchema = z.object({
  carlEmail: z.string().trim().email().transform(normalizeFounderCalibrationEmail),
  mariaEmail: z.string().trim().email().transform(normalizeFounderCalibrationEmail),
  reviewerEmails: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A founder setup reason is required."),
})

export async function reviewCalibrationSessionAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CalibrationReviewSchema.parse(Object.fromEntries(formData))
  const founderFilter = await resolveFounderCalibrationUserFilter()
  const session = await prisma.councilSession.findFirst({
    where: { id: parsed.councilSessionId, user: founderFilter.where },
    select: { id: true },
  })
  if (!session) throw new Error("Founder calibration session not found.")

  const review = await prisma.qualityReview.create({
    data: {
      reviewerId: actor.id,
      councilSessionId: session.id,
      targetType: "FounderCalibration",
      label: parsed.label,
      severity: parsed.severity,
      reason: parsed.reason,
      metadata: {
        reviewedFrom: "admin_calibration",
        calibrationIssueType: parsed.calibrationIssueType === "none" ? null : parsed.calibrationIssueType,
        goldenExample: parsed.label === "ready",
        relatedPromptVersion: parsed.relatedPromptVersion || null,
        relatedGoldenExampleId: parsed.relatedGoldenExampleId || null,
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "founder_calibration.review.create",
      targetType: "CouncilSession",
      targetId: session.id,
      reason: parsed.reason,
      metadata: {
        qualityReviewId: review.id,
        label: parsed.label,
        severity: parsed.severity,
        calibrationIssueType: parsed.calibrationIssueType,
        relatedPromptVersion: parsed.relatedPromptVersion || null,
        relatedGoldenExampleId: parsed.relatedGoldenExampleId || null,
      },
    },
  })

  revalidatePath("/calibration")
  revalidatePath("/calibration/live")
  revalidatePath("/calibration/setup")
  revalidatePath("/pilot")
  revalidatePath("/council")
}

export async function addFounderCalibrationParticipantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = FounderParticipantSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/calibration/setup?status=participant_invalid")
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true },
  })

  const participant = await prisma.founderCalibrationParticipant.upsert({
    where: { email: parsed.data.email },
    create: {
      email: parsed.data.email,
      userId: user?.id ?? null,
      participantRole: parsed.data.participantRole,
      status: "active",
      addedById: actor.id,
      reason: parsed.data.reason,
    },
    update: {
      userId: user?.id ?? null,
      participantRole: parsed.data.participantRole,
      status: "active",
      reason: parsed.data.reason,
    },
  })

  await auditFounderParticipant(actor.id, "founder_calibration_participant.upsert", participant.id, parsed.data.reason, {
    email: parsed.data.email,
    participantRole: parsed.data.participantRole,
    status: "active",
    linkedUser: Boolean(user),
  })
  revalidateFounderCalibrationPaths()
  redirect("/calibration/setup?status=participant_saved")
}

export async function setupFounderCalibrationPairAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = FounderPairSetupSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/calibration/setup?status=pair_invalid")
  }

  await setupFounderCalibrationParticipants({
    carlEmail: parsed.data.carlEmail,
    mariaEmail: parsed.data.mariaEmail,
    reviewerEmails: parseReviewerEmails(parsed.data.reviewerEmails),
    actorEmail: actor.email,
    reason: parsed.data.reason,
  })
  revalidateFounderCalibrationPaths()
  redirect("/calibration/setup?status=pair_saved")
}

export async function pauseFounderCalibrationParticipantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = FounderParticipantStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/calibration/setup?status=participant_invalid")
  }

  const participant = await prisma.founderCalibrationParticipant.findUnique({
    where: { id: parsed.data.id },
  })
  if (!participant) redirect("/calibration/setup?status=participant_missing")

  const updated = await prisma.founderCalibrationParticipant.update({
    where: { id: participant.id },
    data: { status: "paused", reason: parsed.data.reason },
  })

  await auditFounderParticipant(actor.id, "founder_calibration_participant.pause", updated.id, parsed.data.reason, {
    email: updated.email,
    participantRole: updated.participantRole,
    status: "paused",
  })
  revalidateFounderCalibrationPaths()
  redirect("/calibration/setup?status=participant_paused")
}

export async function activateFounderCalibrationParticipantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = FounderParticipantStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/calibration/setup?status=participant_invalid")
  }

  const existing = await prisma.founderCalibrationParticipant.findUnique({
    where: { id: parsed.data.id },
    select: { email: true },
  })
  if (!existing) redirect("/calibration/setup?status=participant_missing")
  const user = await prisma.user.findUnique({
    where: { email: existing.email },
    select: { id: true },
  })
  const participant = await prisma.founderCalibrationParticipant.update({
    where: { id: parsed.data.id },
    data: { status: "active", userId: user?.id ?? null, reason: parsed.data.reason },
  })

  await auditFounderParticipant(actor.id, "founder_calibration_participant.activate", participant.id, parsed.data.reason, {
    email: participant.email,
    participantRole: participant.participantRole,
    status: "active",
    linkedUser: Boolean(user ?? participant.userId),
  })
  revalidateFounderCalibrationPaths()
  redirect("/calibration/setup?status=participant_activated")
}

export async function syncFounderCalibrationParticipantAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = FounderParticipantStatusSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    redirect("/calibration/setup?status=participant_invalid")
  }

  const participant = await prisma.founderCalibrationParticipant.findUnique({
    where: { id: parsed.data.id },
    select: { id: true, email: true, participantRole: true },
  })
  if (!participant) redirect("/calibration/setup?status=participant_missing")
  const user = await prisma.user.findUnique({
    where: { email: participant.email },
    select: { id: true },
  })
  const updated = await prisma.founderCalibrationParticipant.update({
    where: { id: participant.id },
    data: { userId: user?.id ?? null, reason: parsed.data.reason },
  })

  await auditFounderParticipant(actor.id, "founder_calibration_participant.sync", participant.id, parsed.data.reason, {
    email: participant.email,
    participantRole: updated.participantRole,
    linkedUser: Boolean(user),
  })
  revalidateFounderCalibrationPaths()
  redirect("/calibration/setup?status=participant_synced")
}

async function auditFounderParticipant(actorId: string, action: string, targetId: string, reason: string, metadata: Prisma.InputJsonObject) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType: "FounderCalibrationParticipant",
      targetId,
      reason,
      metadata,
    },
  })
}

function revalidateFounderCalibrationPaths() {
  revalidatePath("/calibration")
  revalidatePath("/calibration/live")
  revalidatePath("/calibration/setup")
  revalidatePath("/users")
}

function parseReviewerEmails(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean)
}
