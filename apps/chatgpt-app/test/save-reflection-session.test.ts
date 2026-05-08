import { test } from 'node:test'
import assert from 'node:assert'
import { saveReflectionSession } from '../src/tools/save-reflection-session'

test('saveReflectionSession throws for unauthenticated requests', async () => {
  await assert.rejects(
    async () => saveReflectionSession({} as any, undefined, { prisma: {} as any }),
    { message: /Authentication required/ }
  )
})

test('saveReflectionSession returns saved session id on success', async () => {
  const mockPrisma = {
    journalEntry: {
      create: async ({ data }: any) => ({ id: 'journal-id', ...data })
    },
    entryAnalysis: {
      create: async ({ data }: any) => ({ id: 'analysis-id', ...data })
    },
    avatarResponse: {
      create: async ({ data }: any) => ({ id: 'avatar-id', ...data })
    },
    generatedPrompt: {
      create: async ({ data }: any) => ({ id: 'prompt-id', ...data })
    }
  }

  const payload = {
    entryText: 'A reflective entry',
    analysis: {
      safetyStatus: 'clear',
      emotionalSignals: ['hope'],
      languagePatterns: ['soft'],
      behavioralPatterns: [{ label: 'patience', evidenceCount: 1, confidence: 0.9 }],
      contradictions: [{ statedDesire: 'connection', conflictingBehavior: 'withdrawing' }],
      suggestedLevel: 2,
      summary: 'A gentle insight.'
    },
    avatarResponse: {
      openingLine: 'Yes.',
      mirror: 'You feel true.',
      patternName: 'Softness',
      contradiction: 'You want closeness but pull away.',
      socraticQuestion: 'What does closeness look like now?',
      integrationStep: 'Reach out for one small contact.',
      closingLine: 'You are enough.'
    },
    generatedPrompt: {
      title: 'Gentle Exploration',
      context: 'Notice small shifts.',
      materialsAndPreparation: 'A pen and paper.',
      execution: 'Write about one tiny change.',
      integration: 'Check in with yourself later.'
    }
  }

  const result = await saveReflectionSession(payload, 'user-123', { prisma: mockPrisma as any })

  assert.deepStrictEqual(result, { sessionId: 'journal-id', saved: true })
})