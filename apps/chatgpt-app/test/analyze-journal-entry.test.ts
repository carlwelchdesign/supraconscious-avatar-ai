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

test('analyzeJournalEntry suppresses interpretation during a safety short-circuit', async () => {
  let analyzeCalled = false
  const output = await analyzeJournalEntry(
    { text: 'I cannot tell what is real right now.' },
    {
      classifyJournalSafety: async () => ({
        severity: 'high',
        flags: ['severe_dissociation'],
        recommendedAction: 'Use immediate support.',
        userMessage: 'Pause reflection and contact immediate support.',
        allowReflectiveFlow: false
      }),
      analyzeEntry: async () => {
        analyzeCalled = true
        return mappedAnalysis
      }
    }
  )

  assert.strictEqual(analyzeCalled, false)
  assert.strictEqual(output.safetyStatus, 'crisis')
  assert.deepStrictEqual(output.behavioralPatterns, [])
  assert.match(output.summary, /support/i)
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
