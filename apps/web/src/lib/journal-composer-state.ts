import type { LivingFieldState } from "@/components/ambient/living-field"

export type DraftSaveState = "empty" | "dirty" | "saving" | "saved" | "offline" | "error"

export function resolveLivingFieldState(input: {
  hasText: boolean
  isFocused: boolean
  isSubmitting: boolean
  safetySeverity?: string | null
}): LivingFieldState {
  if (input.safetySeverity === "high" || input.safetySeverity === "medium") return "grounding"
  if (input.isSubmitting) return "reflecting"
  if (input.hasText || input.isFocused) return "listening"
  return "resting"
}

export function shouldAutosaveDraft(input: {
  text: string
  isSubmitting: boolean
  isOnline: boolean
}) {
  return input.text.trim().length > 0 && !input.isSubmitting && input.isOnline
}
