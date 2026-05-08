import { test } from 'node:test'
import assert from 'node:assert'
import { generateAvatarReflection } from '../src/tools/generate-avatar-reflection'

test('generateAvatarReflection rejects when missing entryId and text', async () => {
  await assert.rejects(
    async () => generateAvatarReflection({}, { prisma: {} as any, classifyJournalSafety: async () => ({ severity: 'none' }) as any, generateAvatarResponse: async () => ({}) as any }),
    { message: /Invalid input/ }
  )
})

test('generateAvatarReflection returns mapped response for safe input', async () => {
  const result = await generateAvatarReflection(
    { text: 'I feel hopeful today', tone: 'gentle' },
    {
      classifyJournalSafety: async (text: string) => {
        assert.strictEqual(text, 'I feel hopeful today')
        return { severity: 'none', flags: [] }
      },
      generateAvatarResponse: async () => ({
        openingLine: 'Hello there.',
        mirror: 'You are seen.',
        patternName: 'Hope Pattern',
        contradiction: 'You want action but feel stuck.',
        socraticQuestion: 'What small step feels possible?',
        integrationStep: 'Breathe and choose one thing.',
        closingLine: 'You are not alone.'
      }) as any,
      prisma: {} as any
    }
  )

  assert.deepStrictEqual(result, {
    openingLine: 'Hello there.',
    mirror: 'You are seen.',
    patternName: 'Hope Pattern',
    contradiction: 'You want action but feel stuck.',
    socraticQuestion: 'What small step feels possible?',
    integrationStep: 'Breathe and choose one thing.',
    closingLine: 'You are not alone.'
  })
})

test('generateAvatarReflection returns grounding content for high-safety input', async () => {
  const result = await generateAvatarReflection(
    { text: 'I want to hurt myself', tone: 'direct' },
    {
      classifyJournalSafety: async () => ({ severity: 'high', flags: [] }),
      generateAvatarResponse: async () => ({}) as any,
      prisma: {} as any
    }
  )

  assert.strictEqual(result.patternName, 'Grounding')
  assert.ok(result.openingLine.includes('Pause here'))
})