import {
  analyzeEntry,
} from "./analyze-entry.js"
import { generateAvatarResponse } from "./generate-avatar-response.js"
import { generateCouncilRun } from "./generate-council-run.js"
import { generateSymbolicPrompt } from "./generate-symbolic-prompt.js"
import { retrieveCouncilContext } from "./source-context.js"
import { buildSourceProvenanceMessage, SOURCE_PROVENANCE_PILOT_SCOPE } from "./source-provenance.js"
import { shouldWritePatternMemory, updatePatternMemory } from "./pattern-memory.js"
import { checkAndAdvanceProgression } from "./progression.js"
import { classifyJournalSafety } from "./safety-classifier.js"
import { validateCouncilRunForPilot } from "./council-pilot-validator.js"
import { buildCouncilPromptVersion, resolveCouncilPromptTemplate } from "./council-prompt-template.js"
import { readFounderCalibrationScenario, type FounderCalibrationScenario } from "./founder-calibration-scenarios.js"
import {
  buildGenerationTraceLangSmithMetadata,
  recordLangSmithEvent,
  withLangSmithRun,
  type LangSmithTraceContext,
} from "./langsmith-observability.js"
import { emitPilotEvent, hashPilotInput } from "./pilot-events.js"
import { prisma } from "@inner-avatar/db"

export type CouncilReflectionUser = {
  id: string
  avatarTone: string
  intensityLevel: number
  currentLevel: number
  avatarStage: number
  patternMemoryEnabled: boolean
}

export type CouncilReflectionInput = {
  text: string
  inputMode?: "text" | "voice"
  councilModeEnabled: boolean
  ragEnabled: boolean
  calibrationScenario?: FounderCalibrationScenario
  requestId?: string
}

export async function runCouncilReflection(user: CouncilReflectionUser, input: CouncilReflectionInput) {
  const { value } = await withLangSmithRun("inner-council.reflection", {
    requestId: input.requestId,
    userId: user.id,
    inputHash: hashPilotInput(input.text),
    inputMode: input.inputMode ?? "text",
    councilModeEnabled: input.councilModeEnabled,
    ragEnabled: input.ragEnabled,
    calibrationScenario: readFounderCalibrationScenario(input.calibrationScenario),
  }, async (langsmith) => runCouncilReflectionInternal(user, input, langsmith))

  return value
}

async function runCouncilReflectionInternal(user: CouncilReflectionUser, input: CouncilReflectionInput, langsmith: LangSmithTraceContext) {
  const calibrationScenario = readFounderCalibrationScenario(input.calibrationScenario)
  const featureFlags = {
    council_mode: input.councilModeEnabled,
    rag_enabled: input.ragEnabled,
  }
  const inputMode = input.inputMode ?? "text"
  const journalEntry = await prisma.journalEntry.create(buildJournalEntryCreateArgs(user.id, input.text, inputMode))
  recordLangSmithEvent(langsmith, "journal_submitted", {
    requestId: input.requestId,
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputHash: hashPilotInput(input.text),
    inputMode,
    wordCount: input.text.trim().split(/\s+/).filter(Boolean).length,
    calibrationScenario,
  })

  await emitPilotEvent({
    eventName: "journal_submitted",
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputText: input.text,
    featureFlags,
    requestId: input.requestId,
    properties: { inputMode, wordCount: input.text.trim().split(/\s+/).filter(Boolean).length, calibrationScenario },
  })

  const safetyStart = Date.now()
  const safety = await classifyJournalSafety(input.text)
  const safetyLatencyMs = Date.now() - safetyStart
  recordLangSmithEvent(langsmith, "safety_classified", {
    requestId: input.requestId,
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputHash: hashPilotInput(input.text),
    safetySeverity: safety.severity,
    flags: safety.flags,
    allowReflectiveFlow: safety.allowReflectiveFlow,
    latencyMs: safetyLatencyMs,
    calibrationScenario,
  })
  await emitPilotEvent({
    eventName: "safety_classified",
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputText: input.text,
    safetySeverity: safety.severity,
    featureFlags,
    requestId: input.requestId,
    properties: { flags: safety.flags, allowReflectiveFlow: safety.allowReflectiveFlow, calibrationScenario },
  })

  if (safety.severity !== "none") {
    await prisma.safetyEvent.create({
      data: {
        userId: user.id,
        journalEntryId: journalEntry.id,
        severity: safety.severity,
        flags: safety.flags,
        recommendedAction: safety.recommendedAction,
      },
    })
  }

  if (!safety.allowReflectiveFlow || safety.severity === "high") {
    const avatarResponse = await prisma.avatarResponse.create({
      data: {
        userId: user.id,
        journalEntryId: journalEntry.id,
        openingLine: "Pause here.",
        mirror: safety.userMessage,
        patternName: "Grounding",
        socraticQuestion: "Can you name one place of support available to you right now?",
        integrationStep: "Name five things you can see. Write one sentence about where you are right now.",
        closingLine: "Do not solve everything in this moment.",
      },
    })

    const prompt = await prisma.generatedPrompt.create({
      data: {
        userId: user.id,
        journalEntryId: journalEntry.id,
        level: 1,
        title: "Return to the Room",
        context: "When the entry feels urgent or unsafe, the first reflection is orientation.",
        materials: "A visible object, a steady surface, and one sentence.",
        execution: "Look around and name five things you can see. Place one hand on a surface and write where you are.",
        integration: "What is one next step that keeps you connected to real support?",
        targetPattern: "grounding",
      },
    })

    await prisma.generationTrace.create({
      data: {
        userId: user.id,
        traceType: "safety",
        inputHash: hashPilotInput(input.text),
        outputJson: {
          ...safety,
          langsmith: buildGenerationTraceLangSmithMetadata(langsmith, {
            step: "safety_bypass",
            requestId: input.requestId,
            journalEntryId: journalEntry.id,
            safetySeverity: safety.severity,
            latencyMs: safetyLatencyMs,
          }),
        },
        validationStatus: "safety_bypass",
        latencyMs: safetyLatencyMs,
      },
    })

    await emitPilotEvent({
      eventName: "council_response_finalized",
      userId: user.id,
      journalEntryId: journalEntry.id,
      inputText: input.text,
      sourceMode: "none",
      safetySeverity: safety.severity,
      featureFlags,
      requestId: input.requestId,
      properties: { safetyBypass: true, calibrationScenario },
    })

    return {
      journalEntry,
      safety,
      analysis: null,
      avatarResponse,
      prompt,
      progression: unchangedProgression(user),
    }
  }

  const analysisStart = Date.now()
  const analysis = await analyzeEntry(input.text, safety)
  const analysisLatencyMs = Date.now() - analysisStart
  recordLangSmithEvent(langsmith, "entry_analyzed", {
    requestId: input.requestId,
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputHash: hashPilotInput(input.text),
    safetySeverity: safety.severity,
    suggestedLevel: analysis.suggestedLevel,
    intensityScore: analysis.emotionalSignals.intensity,
    patternCount: analysis.behavioralPatterns.length,
    latencyMs: analysisLatencyMs,
    calibrationScenario,
  })

  if (input.councilModeEnabled) {
    return runCouncilMode(user, input, journalEntry, safety, analysis, featureFlags, {
      safetyLatencyMs,
      analysisLatencyMs,
    }, langsmith)
  }

  const [storedAnalysis, avatar, prompt] = await Promise.all([
    prisma.entryAnalysis.create({
      data: buildAnalysisData(user.id, journalEntry.id, analysis),
    }),
    generateAvatarResponse(input.text, analysis, safety, {
      tone: user.avatarTone,
      intensity: user.intensityLevel,
      currentLevel: user.currentLevel,
      avatarStage: user.avatarStage,
    }),
    generateSymbolicPrompt(analysis, safety),
  ])

  const [avatarResponse, generatedPrompt] = await Promise.all([
    prisma.avatarResponse.create({
      data: {
        userId: user.id,
        journalEntryId: journalEntry.id,
        openingLine: avatar.openingLine,
        mirror: avatar.mirror,
        patternName: avatar.patternName,
        contradiction: avatar.contradiction,
        socraticQuestion: avatar.socraticQuestion,
        integrationStep: avatar.integrationStep,
        closingLine: avatar.closingLine,
      },
    }),
    prisma.generatedPrompt.create({
      data: buildPromptData(user.id, journalEntry.id, prompt),
    }),
    maybeUpdateMemory(user, journalEntry.id, analysis),
  ])

  const progression = await checkAndAdvanceProgression(user.id, user.currentLevel, user.avatarStage)

  return { journalEntry, safety, analysis: storedAnalysis, avatarResponse, prompt: generatedPrompt, progression }
}

export function buildJournalEntryCreateArgs(userId: string, rawText: string, inputMode: "text" | "voice") {
  return {
    data: {
      userId,
      rawText,
      inputMode,
    },
    select: { id: true },
  } as const
}

function unchangedProgression(user: CouncilReflectionUser) {
  return {
    levelChanged: false,
    stageChanged: false,
    newLevel: user.currentLevel,
    newStage: user.avatarStage,
    previousLevel: user.currentLevel,
    previousStage: user.avatarStage,
  }
}

async function runCouncilMode(
  user: CouncilReflectionUser,
  input: CouncilReflectionInput,
  journalEntry: { id: string },
  safety: Awaited<ReturnType<typeof classifyJournalSafety>>,
  analysis: Awaited<ReturnType<typeof analyzeEntry>>,
  featureFlags: Record<string, boolean>,
  timings: { safetyLatencyMs: number; analysisLatencyMs: number },
  langsmith: LangSmithTraceContext,
) {
  const calibrationScenario = readFounderCalibrationScenario(input.calibrationScenario)
  const retrievalStart = Date.now()
  const sourceContext = input.ragEnabled
    ? await retrieveCouncilContext(input.text, { safetySeverity: safety.severity })
    : []
  const retrievalLatencyMs = Date.now() - retrievalStart
  const sourceMode = input.ragEnabled
    ? sourceContext.length > 0 ? "rag" : "no_eligible_source"
    : "none"
  recordLangSmithEvent(langsmith, "rag_retrieved", {
    requestId: input.requestId,
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputHash: hashPilotInput(input.text),
    sourceMode,
    safetySeverity: safety.severity,
    selectedCount: sourceContext.length,
    selectedSources: sourceContext.map((chunk) => ({
      id: chunk.id,
      sourceDocumentId: chunk.sourceDocumentId,
      title: chunk.title,
      rank: chunk.rank,
      score: chunk.score,
      matchedTerms: chunk.matchedTerms,
      matchedFields: chunk.matchedFields,
      sourcePolicyVersion: chunk.sourcePolicyVersion,
    })),
    latencyMs: retrievalLatencyMs,
    calibrationScenario,
  })

  if (input.ragEnabled) {
    await emitPilotEvent({
      eventName: "rag_retrieved",
      userId: user.id,
      journalEntryId: journalEntry.id,
      inputText: input.text,
      sourceMode,
      safetySeverity: safety.severity,
      featureFlags,
      requestId: input.requestId,
      properties: { selectedCount: sourceContext.length, latencyMs: retrievalLatencyMs, calibrationScenario },
    })
  }

  await emitPilotEvent({
    eventName: "council_run_started",
    userId: user.id,
    journalEntryId: journalEntry.id,
    inputText: input.text,
    sourceMode,
    safetySeverity: safety.severity,
    featureFlags,
    requestId: input.requestId,
    properties: { calibrationScenario },
  })

  const councilPromptTemplate = await resolveCouncilPromptTemplate()
  const councilPromptVersion = buildCouncilPromptVersion(councilPromptTemplate)
  recordLangSmithEvent(langsmith, "prompt_resolved", {
    requestId: input.requestId,
    userId: user.id,
    journalEntryId: journalEntry.id,
    promptKey: councilPromptTemplate.key,
    promptVersion: councilPromptVersion,
    promptSource: councilPromptTemplate.source,
    calibrationScenario,
  })
  const councilStart = Date.now()
  const councilRun = await generateCouncilRun(input.text, analysis, safety, {
    tone: user.avatarTone,
    intensity: user.intensityLevel,
    currentLevel: user.currentLevel,
    avatarStage: user.avatarStage,
    sourceContext,
    promptTemplate: councilPromptTemplate,
  })
  const councilLatencyMs = Date.now() - councilStart
  const validation = validateCouncilRunForPilot(councilRun, { sourceContext, safety, sourceMode })
  recordLangSmithEvent(langsmith, "council_validated", {
    requestId: input.requestId,
    userId: user.id,
    journalEntryId: journalEntry.id,
    sourceMode,
    safetySeverity: safety.severity,
    model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
    promptVersion: councilPromptVersion,
    validationStatus: validation.passed ? "validated" : "pilot_validation_failed",
    failedRules: validation.failedRules,
    warnings: validation.warnings,
    citationCoverage: validation.citationCoverage,
    evidenceCoverage: validation.evidenceCoverage,
    latencyMs: councilLatencyMs,
    calibrationScenario,
  })
  const prompt = await generateSymbolicPrompt(analysis, safety)
  const storedAnalysis = await prisma.entryAnalysis.create({
    data: buildAnalysisData(user.id, journalEntry.id, analysis),
  })
  const retrievalTraceCreates = buildRetrievalTraceCreates(user.id, input.text, sourceContext, input.ragEnabled, retrievalLatencyMs, langsmith, input.requestId)

  const councilSession = await prisma.councilSession.create({
    data: {
      userId: user.id,
      journalEntryId: journalEntry.id,
      status: validation.passed ? "completed" : "completed_with_warnings",
      observerSignal: councilRun.observer,
      safetySnapshot: safety,
      sourceMode,
      messages: {
        create: councilRun.messages.map((message) => ({
          role: message.role,
          displayName: message.displayName,
          lens: message.lens,
          content: message.content,
          evidence: message.evidence,
          confidence: message.confidence,
          riskLevel: message.riskLevel,
          abstained: message.abstained,
          abstainReason: message.abstainReason || null,
          sourceChunkIds: message.sourceChunkIds,
        })),
      },
      synthesis: {
        create: {
          guideName: councilRun.synthesis.guideName,
          openingLine: councilRun.synthesis.openingLine,
          coreTension: councilRun.synthesis.coreTension,
          integratorQuestion: councilRun.synthesis.integratorQuestion,
          integrationStep: councilRun.synthesis.integrationStep,
          closingLine: councilRun.synthesis.closingLine,
          sourceChunkIds: councilRun.synthesis.sourceChunkIds,
        },
      },
      generationTraces: {
        create: [
          {
            userId: user.id,
            traceType: "safety",
            inputHash: hashPilotInput(input.text),
            outputJson: {
              ...safety,
              langsmith: buildGenerationTraceLangSmithMetadata(langsmith, {
                step: "safety",
                requestId: input.requestId,
                journalEntryId: journalEntry.id,
                safetySeverity: safety.severity,
                latencyMs: timings.safetyLatencyMs,
              }),
            },
            validationStatus: "validated",
            latencyMs: timings.safetyLatencyMs,
          },
          {
            userId: user.id,
            traceType: "analysis",
            inputHash: hashPilotInput(input.text),
            outputJson: {
              summary: analysis.summary,
              suggestedLevel: analysis.suggestedLevel,
              langsmith: buildGenerationTraceLangSmithMetadata(langsmith, {
                step: "analysis",
                requestId: input.requestId,
                journalEntryId: journalEntry.id,
                suggestedLevel: analysis.suggestedLevel,
                intensityScore: analysis.emotionalSignals.intensity,
                patternCount: analysis.behavioralPatterns.length,
                latencyMs: timings.analysisLatencyMs,
              }),
            },
            validationStatus: "validated",
            latencyMs: timings.analysisLatencyMs,
          },
          {
            userId: user.id,
            traceType: "council",
            model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
            promptVersion: councilPromptVersion,
            inputHash: hashPilotInput(input.text),
            outputJson: {
              councilRun,
              pilotValidation: validation,
              promptTemplate: { key: councilPromptTemplate.key, version: councilPromptTemplate.version, source: councilPromptTemplate.source },
              calibration: { scenario: calibrationScenario },
              langsmith: buildGenerationTraceLangSmithMetadata(langsmith, {
                step: "council",
                requestId: input.requestId,
                journalEntryId: journalEntry.id,
                sourceMode,
                safetySeverity: safety.severity,
                promptKey: councilPromptTemplate.key,
                promptVersion: councilPromptVersion,
                promptSource: councilPromptTemplate.source,
                model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
                validationStatus: validation.passed ? "validated" : "pilot_validation_failed",
                failedRules: validation.failedRules,
                warnings: validation.warnings,
                citationCoverage: validation.citationCoverage,
                evidenceCoverage: validation.evidenceCoverage,
                selectedSourceIds: sourceContext.map((chunk) => chunk.id),
                latencyMs: councilLatencyMs,
                calibrationScenario,
              }),
            },
            validationStatus: validation.passed ? "validated" : "pilot_validation_failed",
            latencyMs: councilLatencyMs,
          },
          ...retrievalTraceCreates.map((trace) => ({ ...trace, promptVersion: councilPromptVersion })),
        ],
      },
    },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
      synthesis: true,
    },
  })

  const [avatarResponse, generatedPrompt] = await Promise.all([
    prisma.avatarResponse.create({
      data: {
        userId: user.id,
        journalEntryId: journalEntry.id,
        openingLine: councilRun.synthesis.openingLine,
        mirror: councilRun.synthesis.coreTension,
        patternName: analysis.behavioralPatterns[0]?.label ?? "Inner Council",
        contradiction: councilRun.observer.contradiction,
        socraticQuestion: councilRun.synthesis.integratorQuestion,
        integrationStep: councilRun.synthesis.integrationStep,
        closingLine: councilRun.synthesis.closingLine,
      },
    }),
    prisma.generatedPrompt.create({
      data: buildPromptData(user.id, journalEntry.id, prompt),
    }),
    maybeUpdateMemory(user, journalEntry.id, analysis),
  ])

  if (shouldWritePatternMemory(user.patternMemoryEnabled)) {
    await emitPilotEvent({
      eventName: "memory_updated",
      userId: user.id,
      journalEntryId: journalEntry.id,
      councilSessionId: councilSession.id,
      inputText: input.text,
      sourceMode,
      safetySeverity: safety.severity,
      featureFlags,
      requestId: input.requestId,
    })
  }

  await Promise.all([
    emitPilotEvent({
      eventName: "council_response_finalized",
      userId: user.id,
      journalEntryId: journalEntry.id,
      councilSessionId: councilSession.id,
      inputText: input.text,
      sourceMode,
      safetySeverity: safety.severity,
      featureFlags,
      requestId: input.requestId,
      properties: { validationPassed: validation.passed, failedRules: validation.failedRules, calibrationScenario },
    }),
    markFirstPilotSessionComplete(user.id),
  ])

  const progression = await checkAndAdvanceProgression(user.id, user.currentLevel, user.avatarStage)

  return {
    journalEntry,
    safety,
    analysis: storedAnalysis,
    avatarResponse,
    prompt: generatedPrompt,
    progression,
    councilSession,
    pilotValidation: validation,
    sourceProvenance: {
      sourceMode,
      message: buildSourceProvenanceMessage(sourceMode),
      sources: sourceContext.map((chunk) => ({
        id: chunk.id,
        title: chunk.title,
        rank: chunk.rank,
        score: chunk.score,
        matchedTerms: chunk.matchedTerms,
        matchedFields: chunk.matchedFields,
        allowedUse: chunk.allowedUse,
        displayExcerpt: chunk.displayExcerpt,
      })),
      pilotScope: SOURCE_PROVENANCE_PILOT_SCOPE,
    },
  }
}

function buildAnalysisData(userId: string, journalEntryId: string, analysis: Awaited<ReturnType<typeof analyzeEntry>>) {
  return {
    userId,
    journalEntryId,
    emotionalSignals: analysis.emotionalSignals,
    languageMarkers: analysis.languageMarkers,
    behavioralPatterns: analysis.behavioralPatterns,
    contradictionSignals: analysis.contradictionSignals,
    avoidanceSignals: analysis.avoidanceSignals,
    intensityScore: analysis.emotionalSignals.intensity,
    suggestedLevel: analysis.suggestedLevel,
    safetyFlags: analysis.safetyFlags,
    summary: analysis.summary,
  }
}

function buildPromptData(userId: string, journalEntryId: string, prompt: Awaited<ReturnType<typeof generateSymbolicPrompt>>) {
  return {
    userId,
    journalEntryId,
    level: prompt.level,
    title: prompt.title,
    context: prompt.context,
    materials: prompt.materialsAndPreparation,
    execution: prompt.execution,
    integration: prompt.integration,
    targetPattern: prompt.targetPattern,
  }
}

async function maybeUpdateMemory(user: CouncilReflectionUser, journalEntryId: string, analysis: Awaited<ReturnType<typeof analyzeEntry>>) {
  return shouldWritePatternMemory(user.patternMemoryEnabled)
    ? updatePatternMemory(user.id, journalEntryId, analysis)
    : Promise.resolve()
}

function buildRetrievalTraceCreates(
  userId: string,
  text: string,
  sourceContext: Awaited<ReturnType<typeof retrieveCouncilContext>>,
  ragEnabled: boolean,
  latencyMs: number,
  langsmith?: LangSmithTraceContext,
  requestId?: string,
) {
  return sourceContext.length > 0
    ? sourceContext.map((chunk) => ({
      userId,
      sourceChunkId: chunk.id,
      traceType: "retrieval",
      inputHash: hashPilotInput(text),
      outputJson: {
        chunkId: chunk.id,
        sourceDocumentId: chunk.sourceDocumentId,
        title: chunk.title,
        rank: chunk.rank,
        matchReason: chunk.matchReason,
        score: chunk.score,
        matchedTerms: chunk.matchedTerms,
        matchedFields: chunk.matchedFields,
        allowedUse: chunk.allowedUse,
        quotePermission: chunk.quotePermission,
        sourcePolicyVersion: chunk.sourcePolicyVersion,
        displayExcerpt: chunk.displayExcerpt,
        langsmith: langsmith
          ? buildGenerationTraceLangSmithMetadata(langsmith, {
            step: "retrieval",
            requestId,
            sourceMode: "rag",
            sourceChunkId: chunk.id,
            sourceDocumentId: chunk.sourceDocumentId,
            title: chunk.title,
            rank: chunk.rank,
            score: chunk.score,
            matchedTerms: chunk.matchedTerms,
            matchedFields: chunk.matchedFields,
            sourcePolicyVersion: chunk.sourcePolicyVersion,
            latencyMs,
          })
          : undefined,
      },
      validationStatus: "selected",
      latencyMs,
    }))
    : ragEnabled
      ? [{
      userId,
      traceType: "retrieval",
      inputHash: hashPilotInput(text),
        outputJson: {
          sourcePolicyVersion: "source-policy-v1",
          selected: [],
          langsmith: langsmith
            ? buildGenerationTraceLangSmithMetadata(langsmith, {
              step: "retrieval",
              requestId,
              sourceMode: "no_eligible_source",
              selectedCount: 0,
              sourcePolicyVersion: "source-policy-v1",
              latencyMs,
            })
            : undefined,
        },
        validationStatus: "no_eligible_source",
        fallbackReason: "No approved rights-compatible source chunks matched the entry.",
        latencyMs,
      }]
      : []
}

async function markFirstPilotSessionComplete(userId: string) {
  await prisma.pilotEnrollment.updateMany({
    where: {
      userId,
      status: { in: ["invited", "active"] },
      completedFirstSessionAt: null,
    },
    data: {
      status: "active",
      startedAt: new Date(),
      completedFirstSessionAt: new Date(),
    },
  })
}
