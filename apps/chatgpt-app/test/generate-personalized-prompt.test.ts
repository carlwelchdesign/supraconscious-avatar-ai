import { test } from 'node:test'
import assert from 'node:assert'
import { generatePersonalizedPrompt } from '../src/tools/generate-personalized-prompt'

test('generatePersonalizedPrompt rejects when missing entryId and text', async () => {
  await assert.rejects(
    async () => generatePersonalizedPrompt({}, { prisma: {} as any, classifyJournalSafety: async () => ({ severity: 'none' }) as any, analyzeEntry: async () => ({}) as any, generateSymbolicPrompt: async () => ({}) as any }),
    { message: /Invalid input/ }
  )
})

test('generatePersonalizedPrompt returns symbolic prompt for safe input', async () => {
  const result = await generatePersonalizedPrompt(
    { text: 'I am exploring what matters to me.' },
    {
      classifyJournalSafety: async (text: string) => {
        assert.strictEqual(text, 'I am exploring what matters to me.')
        return { severity: 'none', flags: [] }
      },
      analyzeEntry: async () => ({}) as any,
      generateSymbolicPrompt: async () => ({
        title: 'Explore the Garden',
        context: 'Use imagery to make meaning.',
        materialsAndPreparation: 'A journal and a quiet space.',
        execution: 'Draw a map of your feelings.',
        integration: 'Notice what stands out.'
      }) as any,
      prisma: {} as any
    }
  )

  assert.deepStrictEqual(result, {
    title: 'Explore the Garden',
    context: 'Use imagery to make meaning.',
    materialsAndPreparation: 'A journal and a quiet space.',
    execution: 'Draw a map of your feelings.',
    integration: 'Notice what stands out.'
  })
})

test('generatePersonalizedPrompt returns grounding prompt for crisis', async () => {
  const result = await generatePersonalizedPrompt(
    { text: 'I might be in danger' },
    {
      classifyJournalSafety: async () => ({ severity: 'high', flags: [] }),
      analyzeEntry: async () => ({}) as any,
      generateSymbolicPrompt: async () => ({}) as any,
      prisma: {} as any
    }
  )

  assert.strictEqual(result.title, 'Return to the Room')
  assert.ok(result.execution.includes('Look around'))
})