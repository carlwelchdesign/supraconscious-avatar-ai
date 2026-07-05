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
    journalEntry: {
      create: async ({ data }: any) => ({ id: 'entry-1', ...data })
    }
  }

  const result = await createJournalEntry(
    { text: 'Testing journal entry', source: 'chatgpt', save: true },
    'user-123',
    { prisma: mockPrisma as any }
  )

  assert.deepStrictEqual(result, { entryId: 'entry-1', saved: true })
})

test('createJournalEntry requires authentication before writing', async () => {
  await assert.rejects(
    async () => createJournalEntry({ text: 'Testing journal entry', source: 'chatgpt', save: true }, undefined, { prisma: {} as any }),
    { message: /Authentication required/ }
  )
})
