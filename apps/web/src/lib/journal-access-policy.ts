import {
  hasRequiredPilotConsents,
  type PilotConsentRecord,
} from "@inner-avatar/auth/consent"

export type JournalAccessUserState = {
  onboardingComplete?: boolean | null
}

export type JournalAccessDecision =
  | { allowed: true }
  | { allowed: false; status: 401 | 403; code: "unauthorized" | "onboarding_required" | "consent_required"; message: string }

export function evaluateJournalAccess(
  user: JournalAccessUserState | null,
  consentRecords: PilotConsentRecord[] = [],
): JournalAccessDecision {
  if (!user) {
    return { allowed: false, status: 401, code: "unauthorized", message: "Unauthorized" }
  }

  if (!user.onboardingComplete) {
    return {
      allowed: false,
      status: 403,
      code: "onboarding_required",
      message: "Complete onboarding before using the journal.",
    }
  }

  if (!hasRequiredPilotConsents(consentRecords)) {
    return {
      allowed: false,
      status: 403,
      code: "consent_required",
      message: "Complete consent before using the journal.",
    }
  }

  return { allowed: true }
}
