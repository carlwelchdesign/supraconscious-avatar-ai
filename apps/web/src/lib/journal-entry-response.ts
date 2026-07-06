export const CREATED_JOURNAL_ENTRY_SELECT = {
  id: true,
  inputMode: true,
  isDraft: true,
  createdAt: true,
} as const

type CreatedJournalEntryRecord = {
  id: string
  inputMode: string
  isDraft: boolean
  createdAt: Date | string
}

export function buildCreatedJournalEntryResponse(entry: CreatedJournalEntryRecord) {
  return {
    journalEntry: {
      id: entry.id,
      inputMode: entry.inputMode,
      isDraft: entry.isDraft,
      createdAt: entry.createdAt instanceof Date ? entry.createdAt.toISOString() : entry.createdAt,
    },
  }
}
