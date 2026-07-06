export function readPatternMemoryClearButtonLabel(armed: boolean) {
  return armed ? "Confirm clear" : "Clear remembered signals"
}

export function readPatternMemoryClearHelperText(armed: boolean) {
  return armed
    ? "This turns off remembered signal records for future use. Select Confirm clear to continue."
    : "Clearing remembered signals keeps your journal entries, but removes saved pattern-memory support from future reflections."
}
