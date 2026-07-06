import { test } from "node:test"
import assert from "node:assert"
import { buildCreatedJournalEntryResponse, CREATED_JOURNAL_ENTRY_SELECT } from "../src/lib/journal-entry-response"

test("created journal entry select excludes raw text and user internals", () => {
  assert.deepEqual(CREATED_JOURNAL_ENTRY_SELECT, {
    id: true,
    inputMode: true,
    isDraft: true,
    createdAt: true,
  })
})

test("created journal entry response serializes only public save metadata", () => {
  const response = buildCreatedJournalEntryResponse({
    id: "entry-1",
    inputMode: "text",
    isDraft: false,
    createdAt: new Date("2026-07-05T12:00:00.000Z"),
    rawText: "private journal text",
    userId: "user-1",
  } as any)

  assert.deepEqual(response, {
    journalEntry: {
      id: "entry-1",
      inputMode: "text",
      isDraft: false,
      createdAt: "2026-07-05T12:00:00.000Z",
    },
  })
  assert.equal(JSON.stringify(response).includes("private journal text"), false)
  assert.equal(JSON.stringify(response).includes("user-1"), false)
})
