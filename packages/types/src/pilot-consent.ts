export const PILOT_CONSENT_VERSION = "pilot-readiness-v1"

export const REQUIRED_PILOT_CONSENTS = [
  "privacy_terms",
  "ai_processing",
  "pilot_participation",
  "safety_limits",
] as const

export const OPTIONAL_PILOT_CONSENTS = ["pattern_memory"] as const

export type RequiredPilotConsent = (typeof REQUIRED_PILOT_CONSENTS)[number]
export type OptionalPilotConsent = (typeof OPTIONAL_PILOT_CONSENTS)[number]
export type PilotConsent = RequiredPilotConsent | OptionalPilotConsent

export type PilotConsentRecord = {
  consentType: string
  consentVersion: string
  granted: boolean
}

export function hasRequiredPilotConsents(records: PilotConsentRecord[]) {
  const grantedTypes = new Set(
    records
      .filter((record) => record.granted && record.consentVersion === PILOT_CONSENT_VERSION)
      .map((record) => record.consentType),
  )

  return REQUIRED_PILOT_CONSENTS.every((consentType) => grantedTypes.has(consentType))
}
