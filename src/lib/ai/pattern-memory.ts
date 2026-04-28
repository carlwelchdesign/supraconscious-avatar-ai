import { prisma } from "@/lib/db"
import type { EntryAnalysis } from "@/lib/ai/schemas"

export async function updatePatternMemory(userId: string, journalEntryId: string, analysis: EntryAnalysis) {
  const patterns = analysis.behavioralPatterns.filter((pattern) => pattern.confidence >= 0.55).slice(0, 3)

  for (const pattern of patterns) {
    const patternType = slugify(pattern.label)
    const existing = await prisma.patternMemory.findFirst({
      where: {
        userId,
        patternType,
        active: true,
      },
    })

    const examples = pattern.evidence.slice(0, 3)

    if (existing) {
      await prisma.patternMemory.update({
        where: { id: existing.id },
        data: {
          evidenceCount: { increment: 1 },
          confidence: Math.max(existing.confidence, pattern.confidence),
          lastSeenAt: new Date(),
          examples: mergeExamples(existing.examples, examples),
        },
      })
    } else {
      await prisma.patternMemory.create({
        data: {
          userId,
          journalEntryId,
          patternType,
          patternLabel: pattern.label,
          confidence: pattern.confidence,
          examples,
        },
      })
    }
  }
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "pattern"
}

function mergeExamples(existing: unknown, next: string[]) {
  const current = Array.isArray(existing) ? existing.filter((item): item is string => typeof item === "string") : []
  return Array.from(new Set([...next, ...current])).slice(0, 6)
}
