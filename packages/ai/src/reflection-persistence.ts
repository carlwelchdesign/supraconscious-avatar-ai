import type { Prisma, PrismaClient } from "@prisma/client"
import { prisma } from "@inner-avatar/db"
import type { SupraconsciousDimension } from "./founder-context-registry.js"

type ReflectionPersistenceClient = Pick<PrismaClient, "$transaction" | "reflectionSession">

export type ReflectionCorrectionType =
  | "prefer"
  | "suppress"
  | "soften"
  | "stop"
  | "do_not_remember"
  | "correct"

export function buildOwnerScopedReflectionWhere(userId: string, reflectionSessionId: string) {
  return { id: reflectionSessionId, userId } as const
}

export async function readReflectionSessionForOwner(
  userId: string,
  reflectionSessionId: string,
  client: ReflectionPersistenceClient = prisma,
) {
  return client.reflectionSession.findFirst({
    where: {
      ...buildOwnerScopedReflectionWhere(userId, reflectionSessionId),
      disabledAt: null,
    },
    include: {
      doctrineVersion: true,
      dimensions: { where: { disabledAt: null }, orderBy: { displayOrder: "asc" } },
      guideSynthesis: true,
      corrections: { where: { disabledAt: null, deletedAt: null }, orderBy: { createdAt: "asc" } },
      promptAssignments: { include: { curatedPrompt: { include: { dimensions: true } } } },
    },
  })
}

export async function recordReflectionCorrection(
  input: {
    userId: string
    reflectionSessionId: string
    dimension?: SupraconsciousDimension
    correctionType: ReflectionCorrectionType
    note?: string
  },
  client: ReflectionPersistenceClient = prisma,
) {
  return client.$transaction(async (tx) => {
    const ownedSession = await tx.reflectionSession.findFirst({
      where: {
        ...buildOwnerScopedReflectionWhere(input.userId, input.reflectionSessionId),
        disabledAt: null,
        ...(input.dimension
          ? { dimensions: { some: { dimension: input.dimension, disabledAt: null } } }
          : {}),
      },
      select: { id: true },
    })
    if (!ownedSession) return null

    const createdAt = new Date()
    const correction = await tx.reflectionCorrection.create({
      data: {
        userId: input.userId,
        reflectionSessionId: input.reflectionSessionId,
        dimension: input.dimension,
        correctionType: input.correctionType,
        note: input.note?.trim() || undefined,
        appliedAt: createdAt,
      },
    })

    await tx.reflectionCapacityProfile.updateMany({
      where: { userId: input.userId, disabledAt: null },
      data: { lastCorrectionAt: createdAt },
    })

    return correction
  })
}

export async function disableReflectionSessionForOwner(
  userId: string,
  reflectionSessionId: string,
  client: ReflectionPersistenceClient = prisma,
) {
  return client.$transaction(async (tx) => {
    const disabledAt = new Date()
    const session = await tx.reflectionSession.updateMany({
      where: {
        ...buildOwnerScopedReflectionWhere(userId, reflectionSessionId),
        disabledAt: null,
      },
      data: { disabledAt, status: "disabled" },
    })
    if (session.count === 0) return false

    await Promise.all([
      tx.dimensionReflection.updateMany({
        where: { reflectionSessionId, disabledAt: null },
        data: { disabledAt },
      }),
      tx.reflectionCorrection.updateMany({
        where: { reflectionSessionId, userId, disabledAt: null },
        data: { disabledAt },
      }),
    ])

    return true
  })
}

export async function deleteReflectionSessionForOwner(
  userId: string,
  reflectionSessionId: string,
  client: ReflectionPersistenceClient = prisma,
) {
  const result = await client.reflectionSession.deleteMany({
    where: buildOwnerScopedReflectionWhere(userId, reflectionSessionId),
  })
  return result.count === 1
}

export async function deleteReflectionCorrectionForOwner(
  userId: string,
  correctionId: string,
  client: Pick<PrismaClient, "reflectionCorrection"> = prisma,
) {
  const deletedAt = new Date()
  const result = await client.reflectionCorrection.updateMany({
    where: { id: correctionId, userId, deletedAt: null },
    data: { deletedAt, disabledAt: deletedAt },
  })
  return result.count === 1
}

export type ReflectionPersistenceTransaction = Prisma.TransactionClient
