import test from "node:test"
import assert from "node:assert/strict"
import { readJournalDeleteButtonLabel, readJournalDeleteHelperText } from "../src/lib/journal-delete-confirmation"

test("journal delete confirmation starts unarmed", () => {
  assert.equal(readJournalDeleteButtonLabel(false), "Delete this entry")
  assert.match(readJournalDeleteHelperText(false), /Nothing will be removed yet/)
})

test("journal delete confirmation explains permanent deletion before submit", () => {
  assert.equal(readJournalDeleteButtonLabel(true), "Confirm delete")
  assert.match(readJournalDeleteHelperText(true), /permanently removes/)
})
