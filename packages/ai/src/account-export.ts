export type AccountExportUser = {
  id: string
  email: string
  name?: string | null
  avatarTone?: string | null
  intensityLevel?: number | null
  currentLevel?: number | null
  avatarStage?: number | null
  patternMemoryEnabled?: boolean | null
  voiceEnabled?: boolean | null
}

export type AccountExportInputs = {
  exportedAt: string
  user: AccountExportUser
  journalEntries: unknown[]
  patternMemories: unknown[]
  councilSessions: unknown[]
  safetyEvents: unknown[]
  consentEvents: unknown[]
  pilotEvents: unknown[]
  subscriptions?: unknown[]
}

export function buildAccountExportPayload(input: AccountExportInputs) {
  return {
    exportedAt: input.exportedAt,
    profile: {
      id: input.user.id,
      email: input.user.email,
      name: input.user.name ?? null,
      avatarTone: input.user.avatarTone ?? null,
      intensityLevel: input.user.intensityLevel ?? null,
      currentLevel: input.user.currentLevel ?? null,
      avatarStage: input.user.avatarStage ?? null,
      patternMemoryEnabled: input.user.patternMemoryEnabled ?? null,
      voiceEnabled: input.user.voiceEnabled ?? null,
    },
    journalEntries: input.journalEntries,
    patternMemories: input.patternMemories,
    councilSessions: input.councilSessions,
    safetyEvents: input.safetyEvents,
    consentEvents: input.consentEvents,
    pilotEvents: input.pilotEvents,
    subscriptions: input.subscriptions ?? [],
  }
}
