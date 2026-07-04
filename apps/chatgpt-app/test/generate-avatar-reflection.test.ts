import { test } from 'node:test'
import assert from 'node:assert'
import { generateAvatarReflection } from '../src/tools/generate-avatar-reflection'
import type { AvatarResponse, SafetyCheck } from '@inner-avatar/ai'

const clearSafety: SafetyCheck = {
  severity: 'none',
  flags: [],
  recommendedAction: 'reflect',
  userMessage: 'Safe to reflect.',
  allowReflectiveFlow: true
}

const highSafety: SafetyCheck = {
  severity: 'high',
  flags: [],
  recommendedAction: 'grounding',
  userMessage: 'Pause here.',
  allowReflectiveFlow: false
}

const safeAvatarResponse: AvatarResponse = {
  openingLine: 'Hello there.',
  mirror: 'You are seen.',
  patternName: 'Hope Pattern',
  contradiction: 'You want action but feel stuck.',
  socraticQuestion: 'What small step feels possible?',
  integrationStep: 'Breathe and choose one thing.',
  closingLine: 'You are not alone.'
}

test('generateAvatarReflection rejects when missing entryId and text', async () => {
  await assert.rejects(
    async () => generateAvatarReflection({}, { classifyJournalSafety: async () => clearSafety, generateAvatarResponse: async () => safeAvatarResponse }),
    { message: /Invalid input/ }
  )
})

test('generateAvatarReflection returns mapped response for safe input', async () => {
  const result = await generateAvatarReflection(
    { text: 'I feel hopeful today', tone: 'gentle' },
    {
      classifyJournalSafety: async (text: string) => {
        assert.strictEqual(text, 'I feel hopeful today')
        return clearSafety
      },
      generateAvatarResponse: async () => safeAvatarResponse
    }
  )

  assert.deepStrictEqual(result, {
    openingLine: 'Hello there.',
    mirror: 'You are seen.',
    patternName: 'Hope Pattern',
    contradiction: 'You want action but feel stuck.',
    socraticQuestion: 'What small step feels possible?',
    integrationStep: 'Breathe and choose one thing.',
    closingLine: 'You are not alone.',
    pilotScope: 'Legacy analysis-only tool during the internal pilot. Use the web app for the Inner Council pilot flow.'
  })
})

test('generateAvatarReflection returns grounding content for high-safety input', async () => {
  const result = await generateAvatarReflection(
    { text: 'I want to hurt myself', tone: 'direct' },
    {
      classifyJournalSafety: async () => highSafety,
      generateAvatarResponse: async () => safeAvatarResponse
    }
  )

  assert.strictEqual(result.patternName, 'Grounding')
  assert.ok(result.openingLine.includes('Pause here'))
})
