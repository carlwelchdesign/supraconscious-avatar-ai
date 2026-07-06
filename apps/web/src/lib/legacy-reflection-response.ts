type SafetyRecord = {
  severity: string
  flags?: string[]
  allowReflectiveFlow?: boolean
  recommendedAction?: string
  userMessage?: string
}

type AnalysisRecord = {
  summary?: string | null
  suggestedLevel?: number
  emotionalSignals?: unknown
  behavioralPatterns?: unknown
}

type AvatarResponseRecord = {
  id?: string
  openingLine?: string | null
  mirror?: string | null
  patternName?: string | null
  contradiction?: string | null
  socraticQuestion?: string | null
  integrationStep?: string | null
  closingLine?: string | null
}

type PromptRecord = {
  id?: string
  title: string
  context: string
  materials?: string | null
  execution: string
  integration: string
  targetPattern?: string | null
}

export function buildLegacyAvatarResponse(input: {
  journalEntryId: string
  safety: SafetyRecord
  analysis: AnalysisRecord
  avatarResponse: AvatarResponseRecord
}) {
  return {
    journalEntryId: input.journalEntryId,
    safety: projectSafety(input.safety),
    analysis: projectAnalysis(input.analysis),
    avatarResponse: {
      id: input.avatarResponse.id,
      openingLine: input.avatarResponse.openingLine ?? null,
      mirror: input.avatarResponse.mirror ?? null,
      patternName: input.avatarResponse.patternName ?? null,
      contradiction: input.avatarResponse.contradiction ?? null,
      socraticQuestion: input.avatarResponse.socraticQuestion ?? null,
      integrationStep: input.avatarResponse.integrationStep ?? null,
      closingLine: input.avatarResponse.closingLine ?? null,
    },
    legacyNotice: "For the full Inner Council flow, use /api/journal/analyze.",
  }
}

export function buildLegacyPromptResponse(input: {
  journalEntryId: string
  safety: SafetyRecord
  analysis: AnalysisRecord
  prompt: PromptRecord
}) {
  return {
    journalEntryId: input.journalEntryId,
    safety: projectSafety(input.safety),
    analysis: projectAnalysis(input.analysis),
    prompt: {
      id: input.prompt.id,
      title: input.prompt.title,
      context: input.prompt.context,
      materials: input.prompt.materials ?? null,
      execution: input.prompt.execution,
      integration: input.prompt.integration,
      targetPattern: input.prompt.targetPattern ?? null,
    },
    legacyNotice: "For the full Inner Council flow, use /api/journal/analyze.",
  }
}

function projectSafety(safety: SafetyRecord) {
  return {
    severity: safety.severity,
    flags: safety.flags ?? [],
    allowReflectiveFlow: safety.allowReflectiveFlow ?? true,
    recommendedAction: safety.recommendedAction,
    userMessage: safety.userMessage,
  }
}

function projectAnalysis(analysis: AnalysisRecord) {
  return {
    summary: analysis.summary ?? "",
    suggestedLevel: analysis.suggestedLevel ?? null,
    emotionalSignals: analysis.emotionalSignals,
    behavioralPatterns: analysis.behavioralPatterns,
  }
}
