import { z } from "zod"
import { prisma } from "@inner-avatar/db"

const GetRecentPatternsSchema = z.object({
  limit: z.number().int().min(1).max(20).default(5)
})

export async function getRecentPatterns(input: any, userId?: string, deps: { prisma?: typeof prisma } = {}) {
  const { prisma: prismaClient = prisma } = deps

  try {
    // This tool requires authentication
    if (!userId) {
      throw new Error("Authentication required to access patterns")
    }

    const validatedInput = GetRecentPatternsSchema.parse(input)

    // Get recent patterns for the user
    const patterns = await prismaClient.patternMemory.findMany({
      where: { userId },
      orderBy: { lastSeenAt: 'desc' },
      take: validatedInput.limit,
      select: {
        label: true,
        evidenceCount: true,
        lastSeenAt: true,
        summary: true
      }
    })

    return {
      patterns: patterns.map(p => ({
        label: p.label,
        evidenceCount: p.evidenceCount,
        lastSeenAt: p.lastSeenAt.toISOString(),
        summary: p.summary
      }))
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    if (error instanceof Error && error.message.includes('Authentication required')) {
      throw error
    }
    throw new Error("Failed to get recent patterns")
  }
}