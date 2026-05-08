import { test } from 'node:test'
import assert from 'node:assert'
import { createJournalEntry } from '../src/tools/create-journal-entry'

test('createJournalEntry throws invalid input for missing fields', async () => {
  await assert.rejects(
    async () => createJournalEntry({ source: 'chatgpt' } as any, { prisma: {} as any }),
    { message: /Invalid input/ }
  )
})

test('createJournalEntry creates entry and returns saved flag', async () => {
  const mockPrisma = {
    user: {
      findUnique: async () => null,
      create: async ({ data }: any) => ({ id: 'demo-user-id', ...data })
    },
    journalEntry: {
      create: async ({ data }: any) => ({ id: 'entry-1', ...data })
    }
  }

  const result = await createJournalEntry(
    { text: 'Testing journal entry', source: 'chatgpt', save: true },
    { prisma: mockPrisma as any }
  )

  assert.deepStrictEqual(result, { entryId: 'entry-1', saved: true })
})