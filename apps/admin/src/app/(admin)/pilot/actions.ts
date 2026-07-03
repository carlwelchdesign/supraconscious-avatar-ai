"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const CohortSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional(),
})

const EnrollmentSchema = z.object({
  pilotCohortId: z.string().min(1),
  email: z.string().trim().email().toLowerCase(),
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
  const actor = await requireAdminUser()
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
      metadata: { userEmail: user.email, pilotCohortId: parsed.pilotCohortId },
    },
  })

  revalidatePath("/pilot")
}
