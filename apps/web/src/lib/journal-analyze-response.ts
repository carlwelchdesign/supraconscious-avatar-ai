type JournalAnalyzeResult = {
  journalEntry?: { id: string } | null
  safety: {
    severity: string
    flags?: string[]
    allowReflectiveFlow?: boolean
  }
  analysis?: { summary?: string | null } | null
  avatarResponse: {
    openingLine?: string | null
    mirror?: string | null
    patternName?: string | null
    contradiction?: string | null
    socraticQuestion?: string | null
    integrationStep?: string | null
    closingLine?: string | null
  }
  prompt: {
    title: string
    context: string
    materials?: string | null
    execution: string
    integration: string
  }
  progression: {
    levelChanged: boolean
    stageChanged: boolean
    newLevel: number
    newStage: number
    previousLevel: number
    previousStage: number
  }
  councilSession?: {
    id: string
    observerSignal?: unknown
    messages?: Array<{
      id: string
      role: string
      displayName: string
      lens: string
      content: string
      confidence: number
      abstained: boolean
    }>
    synthesis?: {
      integratorQuestion: string
      integrationStep: string
      coreTension?: string | null
    } | null
  } | null
  sourceProvenance?: {
    sourceMode: string
    message: string
    pilotScope?: string
    sources: Array<{
      id: string
      title: string
      rank: number
      score?: number
      matchedTerms?: string[]
      matchedFields?: string[]
      allowedUse: string
      displayExcerpt: string | null
    }>
  }
}

export function buildJournalAnalyzeResponse(result: JournalAnalyzeResult) {
  return {
    journalEntry: result.journalEntry ? { id: result.journalEntry.id } : null,
    safety: {
      severity: result.safety.severity,
      flags: result.safety.flags ?? [],
      allowReflectiveFlow: result.safety.allowReflectiveFlow ?? true,
    },
    analysis: result.analysis ? { summary: result.analysis.summary ?? "" } : null,
    avatarResponse: {
      openingLine: result.avatarResponse.openingLine ?? null,
      mirror: result.avatarResponse.mirror ?? null,
      patternName: result.avatarResponse.patternName ?? null,
      contradiction: result.avatarResponse.contradiction ?? null,
      socraticQuestion: result.avatarResponse.socraticQuestion ?? null,
      integrationStep: result.avatarResponse.integrationStep ?? null,
      closingLine: result.avatarResponse.closingLine ?? null,
    },
    prompt: {
      title: result.prompt.title,
      context: result.prompt.context,
      materials: result.prompt.materials ?? null,
      execution: result.prompt.execution,
      integration: result.prompt.integration,
    },
    progression: result.progression,
    councilSession: result.councilSession
      ? {
          id: result.councilSession.id,
          observerSignal: result.councilSession.observerSignal ?? {},
          messages: (result.councilSession.messages ?? []).map((message) => ({
            id: message.id,
            role: message.role,
            displayName: message.displayName,
            lens: message.lens,
            content: message.content,
            confidence: message.confidence,
            abstained: message.abstained,
          })),
          synthesis: result.councilSession.synthesis
            ? {
                integratorQuestion: result.councilSession.synthesis.integratorQuestion,
                integrationStep: result.councilSession.synthesis.integrationStep,
                coreTension: result.councilSession.synthesis.coreTension ?? null,
              }
            : null,
        }
      : null,
    sourceProvenance: result.sourceProvenance
      ? {
          sourceMode: result.sourceProvenance.sourceMode,
          message: result.sourceProvenance.message,
          pilotScope: result.sourceProvenance.pilotScope,
          sources: result.sourceProvenance.sources.map((source) => ({
            id: source.id,
            title: source.title,
            rank: source.rank,
            score: source.score,
            matchedTerms: source.matchedTerms,
            matchedFields: source.matchedFields,
            allowedUse: source.allowedUse,
            displayExcerpt: source.displayExcerpt,
          })),
        }
      : undefined,
  }
}
