import {
  analyzeEntry,
  EntryAnalysisSchema,
  type EntryAnalysis,
  type SafetyCheck,
} from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

export type LegacyJournalEntry = Awaited<ReturnType<typeof resolveLegacyJournalEntry>>

export async function resolveLegacyJournalEntry({
  userId,
  journalEntryId,
  text,
}: {
  userId: string
  journalEntryId?: string
  text?: string
}) {
  if (journalEntryId) {
    const entry = await prisma.journalEntry.findFirst({
      where: { id: journalEntryId, userId },
      include: { analysis: true },
    })

    if (!entry) throw new Error("Journal entry not found.")
    return entry
  }

  return prisma.journalEntry.create({
    data: {
      userId,
      rawText: text ?? "",
      inputMode: "text",
      isDraft: false,
    },
    include: { analysis: true },
  })
}

export async function getOrCreateEntryAnalysis({
  userId,
  journalEntry,
  safety,
}: {
  userId: string
  journalEntry: LegacyJournalEntry
  safety: SafetyCheck
}) {
  const existingAnalysis = readExistingAnalysis(journalEntry.analysis)
  if (existingAnalysis) return existingAnalysis

  const analysis = await analyzeEntry(journalEntry.rawText, safety)

  await prisma.entryAnalysis.upsert({
    where: { journalEntryId: journalEntry.id },
    update: buildAnalysisData(analysis),
    create: {
      journalEntryId: journalEntry.id,
      userId,
      ...buildAnalysisData(analysis),
    },
  })

  return analysis
}

function readExistingAnalysis(analysis: LegacyJournalEntry["analysis"]): EntryAnalysis | null {
  if (!analysis) return null

  return EntryAnalysisSchema.parse({
    emotionalSignals: analysis.emotionalSignals,
    languageMarkers: analysis.languageMarkers,
    behavioralPatterns: analysis.behavioralPatterns,
    contradictionSignals: analysis.contradictionSignals,
    avoidanceSignals: analysis.avoidanceSignals,
    suggestedLevel: analysis.suggestedLevel,
    safetyFlags: analysis.safetyFlags,
    summary: analysis.summary,
  })
}

function buildAnalysisData(analysis: EntryAnalysis) {
  return {
    emotionalSignals: analysis.emotionalSignals,
    languageMarkers: analysis.languageMarkers,
    behavioralPatterns: analysis.behavioralPatterns,
    contradictionSignals: analysis.contradictionSignals,
    avoidanceSignals: analysis.avoidanceSignals,
    intensityScore: analysis.emotionalSignals.intensity,
    suggestedLevel: analysis.suggestedLevel,
    safetyFlags: analysis.safetyFlags,
    summary: analysis.summary,
  }
}
