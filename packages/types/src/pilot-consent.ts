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
  createdAt?: Date | string
}

export function hasRequiredPilotConsents(records: PilotConsentRecord[]) {
  const latestByType = new Map<string, PilotConsentRecord>()

  for (const record of records) {
    const existing = latestByType.get(record.consentType)
    if (!existing || isNewerConsentRecord(record, existing)) {
      latestByType.set(record.consentType, record)
    }
  }

  return REQUIRED_PILOT_CONSENTS.every((consentType) => {
    const latest = latestByType.get(consentType)
    return Boolean(latest?.granted && latest.consentVersion === PILOT_CONSENT_VERSION)
  })
}

function isNewerConsentRecord(candidate: PilotConsentRecord, existing: PilotConsentRecord) {
  const candidateTime = readConsentTime(candidate.createdAt)
  const existingTime = readConsentTime(existing.createdAt)

  if (candidateTime === null && existingTime === null) return false
  if (candidateTime === null) return false
  if (existingTime === null) return true
  return candidateTime > existingTime
}

function readConsentTime(value: Date | string | undefined) {
  if (!value) return null
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value)
  return Number.isFinite(timestamp) ? timestamp : null
}
