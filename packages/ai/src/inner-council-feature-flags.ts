import { prisma } from "@inner-avatar/db"

export const INNER_COUNCIL_FEATURE_FLAGS = [
  {
    key: "council_mode",
    enabled: true,
    description: "Enable the Inner Council reflection flow.",
  },
  {
    key: "rag_enabled",
    enabled: false,
    description: "Allow council generation to retrieve approved source chunks.",
  },
  {
    key: "memory_feedback_enabled",
    enabled: false,
    description: "Enable explicit feedback and correction loops for pattern memory.",
  },
  {
    key: "admin_evals_enabled",
    enabled: false,
    description: "Enable admin quality labels, eval review, and release gates.",
  },
  {
    key: "ontology_rag_enabled",
    enabled: false,
    description: "Allow approved reasoning ontology neighborhoods to be retrieved for future council generation.",
  },
] as const

export async function seedInnerCouncilFeatureFlags() {
  return Promise.all(
    INNER_COUNCIL_FEATURE_FLAGS.map((flag) =>
      prisma.featureFlag.upsert({
        where: { key: flag.key },
        create: {
          key: flag.key,
          description: flag.description,
          enabled: flag.enabled,
          metadata: { seededBy: "inner-council-foundation" },
        },
        update: {
          description: flag.description,
        },
      }),
    ),
  )
}
