export function readJournalDeleteButtonLabel(armed: boolean) {
  return armed ? "Confirm delete" : "Delete this entry"
}

export function readJournalDeleteHelperText(armed: boolean) {
  return armed
    ? "This permanently removes the entry and its saved reflection. Select Confirm delete to continue."
    : "Select once to review before deleting. Nothing will be removed yet."
}
