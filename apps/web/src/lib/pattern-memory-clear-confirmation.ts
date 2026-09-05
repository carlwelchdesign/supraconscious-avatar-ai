export function readPatternMemoryClearButtonLabel(armed: boolean) {
  return armed ? "Confirm clear" : "Clear remembered signals"
}

export function readPatternMemoryClearHelperText(armed: boolean) {
  return armed
    ? "This removes remembered signals and turns pattern memory off. Select Confirm clear to continue."
    : "Your journal entries will stay saved. Clearing removes remembered signals from future reflections."
}
