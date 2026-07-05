import { test } from 'node:test'
import assert from 'node:assert'
import { analyzeJournalEntry } from '../src/tools/analyze-journal-entry'
import type { EntryAnalysis, SafetyCheck } from '@inner-avatar/ai'

const clearSafety: SafetyCheck = {
  severity: 'none',
  flags: [],
  recommendedAction: 'reflect',
  userMessage: 'Safe to reflect.',
  allowReflectiveFlow: true
}

const mappedAnalysis: EntryAnalysis = {
  emotionalSignals: { primary: ['anxiety'], secondary: [], intensity: 4 },
  languageMarkers: {
    repeatedWords: ['very'],
    absolutes: [],
    passiveVoiceExamples: [],
    ownershipLanguageExamples: []
  },
  behavioralPatterns: [
    { label: 'avoidance', evidence: ['postponing'], confidence: 0.8 }
  ],
  contradictionSignals: [
    { statedDesire: 'clarity', conflictingBehavior: 'staying stuck', confidence: 0.7 }
  ],
  avoidanceSignals: [],
  suggestedLevel: 2,
  safetyFlags: { severity: 'none', flags: [] },
  summary: 'A pattern of uncertainty with avoidance signals.'
}

test('analyzeJournalEntry throws invalid input when no entryId or text provided', async () => {
  await assert.rejects(
    async () => analyzeJournalEntry({}, {
      classifyJournalSafety: async () => clearSafety,
      analyzeEntry: async () => mappedAnalysis
    }),
    { message: /Invalid input/ }
  )
})

test('analyzeJournalEntry returns mapped results for valid text input', async () => {
  const output = await analyzeJournalEntry(
    { text: 'I am feeling very uncertain about my next step.' },
    {
      classifyJournalSafety: async (text: string) => {
        assert.strictEqual(text, 'I am feeling very uncertain about my next step.')
        return clearSafety
      },
      analyzeEntry: async () => mappedAnalysis
    }
  )

  assert.deepStrictEqual(output, {
    safetyStatus: 'clear',
    emotionalSignals: ['anxiety'],
    languagePatterns: ['very'],
    behavioralPatterns: [
      { label: 'avoidance', evidenceCount: 1, confidence: 0.8 }
    ],
    contradictions: [
      { statedDesire: 'clarity', conflictingBehavior: 'staying stuck' }
    ],
    suggestedLevel: 2,
    summary: 'A pattern of uncertainty with avoidance signals.',
    pilotScope: 'Legacy analysis-only tool during the internal pilot. Use the web app for the Inner Council pilot flow.'
  })
})

test('analyzeJournalEntry requires authentication for saved entry reads', async () => {
  await assert.rejects(
    async () => analyzeJournalEntry({ entryId: 'entry-1' }, {
      classifyJournalSafety: async () => clearSafety,
      analyzeEntry: async () => mappedAnalysis
    }),
    { message: /Authentication required/ }
  )
})

test('analyzeJournalEntry reads only entries owned by the authenticated user', async () => {
  const mockPrisma = {
    journalEntry: {
      findFirst: async ({ where }: any) => {
        assert.deepStrictEqual(where, { id: 'entry-1', userId: 'user-123' })
        return { id: 'entry-1', userId: 'user-123', rawText: 'Owned entry text' }
      }
    }
  }

  const output = await analyzeJournalEntry(
    { entryId: 'entry-1' },
    'user-123',
    {
      prisma: mockPrisma as any,
      classifyJournalSafety: async (text: string) => {
        assert.strictEqual(text, 'Owned entry text')
        return clearSafety
      },
      analyzeEntry: async () => mappedAnalysis
    } as any
  )

  assert.strictEqual(output.summary, mappedAnalysis.summary)
})
