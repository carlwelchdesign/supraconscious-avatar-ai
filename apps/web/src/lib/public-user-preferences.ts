export const PUBLIC_USER_PREFERENCES_SELECT = {
  id: true,
  email: true,
  name: true,
  avatarTone: true,
  intensityLevel: true,
  currentLevel: true,
  avatarStage: true,
  patternMemoryEnabled: true,
  safetyModeEnabled: true,
  topicsToAvoid: true,
  voiceEnabled: true,
  voiceAutoPlay: true,
  voiceInputDefault: true,
  voiceGender: true,
  voiceStyle: true,
  voiceSpeed: true,
  preferredLanguage: true,
  onboardingComplete: true,
  emailVerified: true,
  createdAt: true,
  updatedAt: true,
} as const

const BLOCKED_PUBLIC_USER_FIELDS = new Set([
  "passwordHash",
  "role",
  "stripeCustomerId",
  "tokenHash",
])

export function assertPublicUserPreferences(value: Record<string, unknown>) {
  for (const key of Object.keys(value)) {
    if (BLOCKED_PUBLIC_USER_FIELDS.has(key)) {
      throw new Error(`Unsafe public user preference field: ${key}`)
    }
  }
}
