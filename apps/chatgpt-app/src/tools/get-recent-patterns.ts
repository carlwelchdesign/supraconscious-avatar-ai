import { z } from "zod"
import { prisma } from "@inner-avatar/db"

const GetRecentPatternsSchema = z.object({
  limit: z.number().int().min(1).max(20).default(5)
})

type PatternSummary = {
  patternLabel: string
  evidenceCount: number
  lastSeenAt: Date
  examples: unknown
}

export async function getRecentPatterns(input: unknown, userId?: string, deps: { prisma?: typeof prisma } = {}) {
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
        patternLabel: true,
        evidenceCount: true,
        lastSeenAt: true,
        examples: true
      }
    })

    return {
      patterns: (patterns as PatternSummary[]).map((p) => ({
        label: p.patternLabel,
        evidenceCount: p.evidenceCount,
        lastSeenAt: p.lastSeenAt.toISOString(),
        summary: Array.isArray(p.examples) && typeof p.examples[0] === 'string'
          ? p.examples[0]
          : p.patternLabel
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
