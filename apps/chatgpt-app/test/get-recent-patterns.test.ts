import { test } from 'node:test'
import assert from 'node:assert'
import { getRecentPatterns } from '../src/tools/get-recent-patterns'

test('getRecentPatterns throws when not authenticated', async () => {
  await assert.rejects(
    async () => getRecentPatterns({}, undefined, { prisma: {} as any }),
    { message: /Authentication required/ }
  )
})

test('getRecentPatterns returns mapped pattern list for authenticated user', async () => {
  const fakeDate = new Date('2026-05-08T12:00:00.000Z')
  const mockPrisma = {
    patternMemory: {
      findMany: async () => [
        {
          patternLabel: 'Cycle of doubt',
          evidenceCount: 3,
          lastSeenAt: fakeDate,
          examples: ['Repeated hesitation before decisions.']
        }
      ]
    }
  }

  const result = await getRecentPatterns({ limit: 1 }, 'user-abc', { prisma: mockPrisma as any })

  assert.deepStrictEqual(result, {
    patterns: [
      {
        label: 'Cycle of doubt',
        evidenceCount: 3,
        lastSeenAt: fakeDate.toISOString(),
        summary: 'Repeated hesitation before decisions.'
      }
    ]
  })
})