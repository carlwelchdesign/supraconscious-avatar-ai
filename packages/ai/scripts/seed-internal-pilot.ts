import { prisma } from "@inner-avatar/db"

const cohortName = process.env.PILOT_COHORT_NAME?.trim() || "Internal Pilot"
const emails = (process.env.PILOT_USER_EMAILS ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean)

const cohort = await prisma.pilotCohort.upsert({
  where: { id: process.env.PILOT_COHORT_ID || "internal-pilot" },
  create: {
    id: process.env.PILOT_COHORT_ID || "internal-pilot",
    name: cohortName,
    status: "active",
    description: "Controlled internal Inner Council pilot cohort.",
    metadata: {
      seedName: "seed-internal-pilot",
      scope: "internal_pilot",
      sourceAllowlist: "product_doctrine_current_month_curriculum",
    },
  },
  update: {
    name: cohortName,
    status: "active",
    metadata: {
      seedName: "seed-internal-pilot",
      scope: "internal_pilot",
      sourceAllowlist: "product_doctrine_current_month_curriculum",
    },
  },
})

const enrolled: string[] = []
const missing: string[] = []

for (const email of emails) {
  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, email: true } })
  if (!user) {
    missing.push(email)
    continue
  }
  await prisma.pilotEnrollment.upsert({
    where: {
      userId_pilotCohortId: {
        userId: user.id,
        pilotCohortId: cohort.id,
      },
    },
    create: {
      userId: user.id,
      pilotCohortId: cohort.id,
      status: "active",
      startedAt: new Date(),
    },
    update: {
      status: "active",
      removedAt: null,
      startedAt: new Date(),
    },
  })
  enrolled.push(user.email)
}

console.log(JSON.stringify({
  cohortId: cohort.id,
  cohortName: cohort.name,
  enrolled,
  missing,
}, null, 2))
