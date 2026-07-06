"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { expandPilotCohort } from "@inner-avatar/ai"
import { requireAdminUser, requireSuperAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { hashEmailForAudit } from "@/lib/audit-metadata"

const CohortSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A cohort setup reason is required."),
})

const EnrollmentSchema = z.object({
  pilotCohortId: z.string().min(1),
  email: z.string().trim().email().toLowerCase(),
  reason: z.string().trim().min(10, "A setup enrollment reason is required."),
})

const ExpansionSchema = z.object({
  pilotCohortId: z.string().min(1),
  emails: z.string().trim().min(1),
  reason: z.string().trim().min(20, "Explain why this pilot expansion is ready."),
})

const PilotSessionReviewSchema = z.object({
  councilSessionId: z.string().min(1),
  label: z.enum(["grounded", "too_vague", "too_intense", "unsupported", "safety_concern", "reviewed"]),
  disposition: z.enum(["reviewed", "blocked", "cleared"]),
  severity: z.enum(["normal", "pilot_blocker"]).default("normal"),
  reason: z.string().trim().min(10, "A pilot review reason is required."),
})

export async function createPilotCohortAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = CohortSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/pilot?status=cohort_invalid")

  const cohort = await prisma.pilotCohort.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      status: "active",
      createdById: actor.id,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "pilot_cohort.create",
      targetType: "PilotCohort",
      targetId: cohort.id,
      reason: parsed.data.reason,
      metadata: { name: cohort.name },
    },
  })

  revalidatePath("/pilot")
  redirect("/pilot?status=cohort_created")
}

export async function enrollPilotUserAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = EnrollmentSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/pilot?status=enrollment_invalid")

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    select: { id: true, email: true },
  })
  if (!user) redirect("/pilot?status=user_missing")

  const enrollment = await prisma.pilotEnrollment.upsert({
    where: {
      userId_pilotCohortId: {
        userId: user.id,
        pilotCohortId: parsed.data.pilotCohortId,
      },
    },
    create: {
      userId: user.id,
      pilotCohortId: parsed.data.pilotCohortId,
      status: "invited",
    },
    update: {
      status: "active",
      removedAt: null,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "pilot_enrollment.upsert",
      targetType: "PilotEnrollment",
      targetId: enrollment.id,
      reason: parsed.data.reason,
      metadata: { userEmailHash: hashEmailForAudit(user.email), pilotCohortId: parsed.data.pilotCohortId, mode: "setup_one_off" },
    },
  })

  revalidatePath("/pilot")
  redirect("/pilot?status=enrollment_saved")
}

export async function expandPilotCohortAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ExpansionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/pilot?status=expansion_invalid")

  const emails = parsed.data.emails
    .split(/[\n,]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  try {
    await expandPilotCohort({
      actorId: actor.id,
      pilotCohortId: parsed.data.pilotCohortId,
      emails,
      reason: parsed.data.reason,
    })
  } catch {
    redirect("/pilot?status=expansion_blocked")
  }

  revalidatePath("/pilot")
  redirect("/pilot?status=expansion_saved")
}

export async function reviewPilotSessionAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = PilotSessionReviewSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/pilot?status=review_invalid")

  const session = await prisma.councilSession.findUnique({
    where: { id: parsed.data.councilSessionId },
    select: { id: true },
  })
  if (!session) redirect("/pilot?status=session_missing")

  const review = await prisma.qualityReview.create({
    data: {
      reviewerId: actor.id,
      councilSessionId: parsed.data.councilSessionId,
      targetType: "PilotSessionFeedback",
      label: parsed.data.label,
      severity: parsed.data.severity,
      reason: parsed.data.reason,
      metadata: {
        feedbackDisposition: parsed.data.disposition,
        reviewedFrom: "admin_pilot",
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "pilot_session.feedback_review.update",
      targetType: "CouncilSession",
      targetId: parsed.data.councilSessionId,
      reason: parsed.data.reason,
      metadata: {
        qualityReviewId: review.id,
        label: parsed.data.label,
        severity: parsed.data.severity,
        feedbackDisposition: parsed.data.disposition,
      },
    },
  })

  revalidatePath("/pilot")
  revalidatePath("/council")
  redirect("/pilot?status=review_saved")
}
