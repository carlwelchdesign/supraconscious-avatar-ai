export const ONBOARDING_CONSENT_ITEMS = [
  ["privacy_terms", "I understand what is stored and processed.", true],
  ["ai_processing", "I consent to AI processing for reflective responses.", true],
  ["pattern_memory", "Optionally remember recurring signals. I can turn this off later in settings.", false],
  ["pilot_participation", "I understand this is an early guided reflection experience.", true],
  ["safety_limits", "I understand this is not therapy, diagnosis, crisis care, or emergency monitoring.", true],
] as const

export function readOnboardingConsentRequirementLabel(required: boolean) {
  return required ? "Required" : "Optional"
}
