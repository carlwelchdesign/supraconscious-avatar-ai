import { test } from 'node:test'
import assert from 'node:assert'
import { runInnerCouncilReflection } from '../src/tools/run-inner-council-reflection'

test('runInnerCouncilReflection rejects short or missing text', async () => {
  await assert.rejects(
    async () => runInnerCouncilReflection({ text: 'too short' }, 'user-123', {
      prisma: mockPrisma({ ragEnabled: false }) as any,
      runCouncilReflection: async () => mockCouncilResult() as any,
    } as any),
    { message: /Invalid input/ },
  )
})

test('runInnerCouncilReflection uses user preferences and feature flags', async () => {
  const calls: any[] = []
  const result = await runInnerCouncilReflection(
    {
      text: 'I feel split between staying protected and saying the true thing.',
      calibrationScenario: 'voice_test',
    },
    'user-123',
    {
      prisma: mockPrisma({ ragEnabled: true }) as any,
      runCouncilReflection: async (user: any, input: any) => {
        calls.push({ user, input })
        return mockCouncilResult()
      },
    } as any,
  )

  assert.equal(calls.length, 1)
  assert.equal(calls[0].user.id, 'user-123')
  assert.equal(calls[0].user.avatarTone, 'gentle')
  assert.equal(calls[0].input.councilModeEnabled, true)
  assert.equal(calls[0].input.ragEnabled, true)
  assert.equal(calls[0].input.calibrationScenario, 'voice_test')
  assert.equal(result.journalEntryId, 'entry-1')
  assert.equal(result.councilSession?.id, 'council-1')
  assert.equal(result.councilSession?.integratorQuestion, 'What truth can you practice gently today?')
  assert.equal(result.sourceProvenance.sourceMode, 'rag')
  assert.equal(result.sourceProvenance.sources[0]?.title, 'Inner Council Doctrine')
  assert.match(result.pilotScope, /not Maria/)
})

test('runInnerCouncilReflection requires an authenticated user record', async () => {
  await assert.rejects(
    async () => runInnerCouncilReflection(
      { text: 'I feel split between what is expected and what is true.' },
      'missing-user',
      {
        prisma: {
          user: { findUnique: async () => null },
          featureFlag: { findUnique: async () => null },
        },
        runCouncilReflection: async () => mockCouncilResult() as any,
      } as any,
    ),
    { message: /Authenticated user not found/ },
  )
})

function mockPrisma({ ragEnabled }: { ragEnabled: boolean }) {
  return {
    user: {
      findUnique: async ({ where }: any) => {
        assert.deepEqual(where, { id: 'user-123' })
        return {
          id: 'user-123',
          avatarTone: 'gentle',
          intensityLevel: 2,
          currentLevel: 3,
          avatarStage: 2,
          patternMemoryEnabled: false,
        }
      },
    },
    featureFlag: {
      findUnique: async ({ where }: any) => {
        if (where.key === 'council_mode') return { enabled: true }
        if (where.key === 'rag_enabled') return { enabled: ragEnabled }
        return null
      },
    },
  }
}

function mockCouncilResult() {
  return {
    journalEntry: { id: 'entry-1' },
    safety: { severity: 'none', flags: [], allowReflectiveFlow: true },
    avatarResponse: {
      openingLine: 'The council is listening.',
      mirror: 'A true part and a protective part are both present.',
      patternName: 'Inner Council',
      contradiction: null,
      socraticQuestion: 'What truth can you practice gently today?',
      integrationStep: 'Write one sentence before acting.',
      closingLine: 'Stay grounded.',
    },
    prompt: { title: 'Practice the True Sentence' },
    progression: {
      levelChanged: false,
      stageChanged: false,
      newLevel: 3,
      newStage: 2,
      previousLevel: 3,
      previousStage: 2,
    },
    councilSession: {
      id: 'council-1',
      messages: [
        {
          role: 'truth_self',
          displayName: 'Truth Self',
          content: 'Tell the truth gently.',
          abstained: false,
        },
      ],
      synthesis: {
        integratorQuestion: 'What truth can you practice gently today?',
        integrationStep: 'Write one sentence before acting.',
      },
    },
    sourceProvenance: {
      sourceMode: 'rag',
      message: 'This reflection used approved source material as background.',
      sources: [
        {
          id: 'chunk-1',
          title: 'Inner Council Doctrine',
          rank: 1,
          allowedUse: 'paraphrase_generation',
          displayExcerpt: null,
        },
      ],
    },
  }
}
