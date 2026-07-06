export function readJournalDeleteButtonLabel(armed: boolean) {
  return armed ? "Confirm delete" : "Delete this entry"
}

export function readJournalDeleteHelperText(armed: boolean) {
  return armed
    ? "This permanently removes the entry and its saved council reflection. Select Confirm delete to continue."
    : "Deletion is permanent. Select Delete this entry once to confirm your intent."
}
