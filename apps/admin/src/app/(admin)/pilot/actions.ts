"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { expandPilotCohort } from "@inner-avatar/ai"
import { requireAdminUser, requireSuperAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const CohortSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
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
  const parsed = CohortSchema.parse(Object.fromEntries(formData))
  const cohort = await prisma.pilotCohort.create({
    data: {
      name: parsed.name,
      description: parsed.description,
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
      metadata: { name: cohort.name },
    },
  })

  revalidatePath("/pilot")
}

export async function enrollPilotUserAction(formData: FormData) {
  const actor = await requireSuperAdminUser()
  const parsed = EnrollmentSchema.parse(Object.fromEntries(formData))
  const user = await prisma.user.findUnique({
    where: { email: parsed.email },
    select: { id: true, email: true },
  })
  if (!user) throw new Error("User not found.")

  const enrollment = await prisma.pilotEnrollment.upsert({
    where: {
      userId_pilotCohortId: {
        userId: user.id,
        pilotCohortId: parsed.pilotCohortId,
      },
    },
    create: {
      userId: user.id,
      pilotCohortId: parsed.pilotCohortId,
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
      reason: parsed.reason,
      metadata: { userEmail: user.email, pilotCohortId: parsed.pilotCohortId, mode: "setup_one_off" },
    },
  })

  revalidatePath("/pilot")
}

export async function expandPilotCohortAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ExpansionSchema.parse(Object.fromEntries(formData))
  const emails = parsed.emails
    .split(/[\n,]/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)

  await expandPilotCohort({
    actorId: actor.id,
    pilotCohortId: parsed.pilotCohortId,
    emails,
    reason: parsed.reason,
  })

  revalidatePath("/pilot")
}

export async function reviewPilotSessionAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = PilotSessionReviewSchema.parse(Object.fromEntries(formData))

  const session = await prisma.councilSession.findUnique({
    where: { id: parsed.councilSessionId },
    select: { id: true },
  })
  if (!session) throw new Error("Council session not found.")

  const review = await prisma.qualityReview.create({
    data: {
      reviewerId: actor.id,
      councilSessionId: parsed.councilSessionId,
      targetType: "PilotSessionFeedback",
      label: parsed.label,
      severity: parsed.severity,
      reason: parsed.reason,
      metadata: {
        feedbackDisposition: parsed.disposition,
        reviewedFrom: "admin_pilot",
      },
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "pilot_session.feedback_review.update",
      targetType: "CouncilSession",
      targetId: parsed.councilSessionId,
      reason: parsed.reason,
      metadata: {
        qualityReviewId: review.id,
        label: parsed.label,
        severity: parsed.severity,
        feedbackDisposition: parsed.disposition,
      },
    },
  })

  revalidatePath("/pilot")
  revalidatePath("/council")
}
