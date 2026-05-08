import { test } from 'node:test'
import assert from 'node:assert'
import { analyzeJournalEntry } from '../src/tools/analyze-journal-entry'

test('analyzeJournalEntry throws invalid input when no entryId or text provided', async () => {
  await assert.rejects(
    async () => analyzeJournalEntry({}, {
      classifyJournalSafety: async () => ({ severity: 'none' }),
      analyzeEntry: async () => ({}) as any
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
        return { severity: 'none' }
      },
      analyzeEntry: async () => ({
        emotionalSignals: { primary: ['anxiety'] },
        languageMarkers: { repeatedWords: ['very'] },
        behavioralPatterns: [
          { label: 'avoidance', evidence: ['postponing'], confidence: 0.8 }
        ],
        contradictionSignals: [
          { statedDesire: 'clarity', conflictingBehavior: 'staying stuck' }
        ],
        suggestedLevel: 2,
        summary: 'A pattern of uncertainty with avoidance signals.'
      }) as any
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
    summary: 'A pattern of uncertainty with avoidance signals.'
  })
})