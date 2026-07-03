import { NextResponse } from "next/server"
import { analyzeEntry } from "@inner-avatar/ai"
import { generateAvatarResponse } from "@inner-avatar/ai"
import { generateCouncilRun } from "@inner-avatar/ai"
import { generateSymbolicPrompt } from "@inner-avatar/ai"
import { retrieveCouncilContext } from "@inner-avatar/ai"
import { shouldWritePatternMemory } from "@inner-avatar/ai"
import { updatePatternMemory } from "@inner-avatar/ai"
import { checkAndAdvanceProgression } from "@inner-avatar/ai"
import { classifyJournalSafety } from "@inner-avatar/ai"
import { JournalAnalyzeRequestSchema } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

export async function POST(request: Request) {
  try {
    const user = await requireAppUser()
    const body = JournalAnalyzeRequestSchema.parse(await request.json())
    const [councilModeEnabled, ragEnabled] = await Promise.all([
      isFeatureEnabled("council_mode", true),
      isFeatureEnabled("rag_enabled", false),
    ])

    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        rawText: body.text,
        inputMode: body.inputMode,
      },
    })

    const safety = await classifyJournalSafety(body.text)

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

      return NextResponse.json({ journalEntry, safety, analysis: null, avatarResponse, prompt })
    }

    const analysis = await analyzeEntry(body.text, safety)

    if (councilModeEnabled) {
      const sourceContext = ragEnabled ? await retrieveCouncilContext(body.text) : []
      const councilRun = await generateCouncilRun(body.text, analysis, safety, {
        tone: user.avatarTone,
        intensity: user.intensityLevel,
        currentLevel: user.currentLevel,
        avatarStage: user.avatarStage,
        sourceContext,
      })
      const retrievalTraceCreates = sourceContext.length > 0
        ? sourceContext.map((chunk) => ({
          userId: user.id,
          sourceChunkId: chunk.id,
          traceType: "retrieval",
          promptVersion: "inner-council-v1",
          outputJson: {
            chunkId: chunk.id,
            sourceDocumentId: chunk.sourceDocumentId,
            title: chunk.title,
            rank: chunk.rank,
            matchReason: chunk.matchReason,
            allowedUse: chunk.allowedUse,
            quotePermission: chunk.quotePermission,
            sourcePolicyVersion: chunk.sourcePolicyVersion,
            displayExcerpt: chunk.displayExcerpt,
          },
          validationStatus: "selected",
        }))
        : ragEnabled
          ? [{
            userId: user.id,
            traceType: "retrieval",
            promptVersion: "inner-council-v1",
            outputJson: { sourcePolicyVersion: "source-policy-v1", selected: [] },
            validationStatus: "no_eligible_source",
            fallbackReason: "No approved rights-compatible source chunks matched the entry.",
          }]
          : []

      const prompt = await generateSymbolicPrompt(analysis, safety)
      const storedAnalysis = await prisma.entryAnalysis.create({
        data: {
          userId: user.id,
          journalEntryId: journalEntry.id,
          emotionalSignals: analysis.emotionalSignals,
          languageMarkers: analysis.languageMarkers,
          behavioralPatterns: analysis.behavioralPatterns,
          contradictionSignals: analysis.contradictionSignals,
          avoidanceSignals: analysis.avoidanceSignals,
          intensityScore: analysis.emotionalSignals.intensity,
          suggestedLevel: analysis.suggestedLevel,
          safetyFlags: analysis.safetyFlags,
          summary: analysis.summary,
        },
      })

      const councilSession = await prisma.councilSession.create({
        data: {
          userId: user.id,
          journalEntryId: journalEntry.id,
          status: "completed",
          observerSignal: councilRun.observer,
          safetySnapshot: safety,
          sourceMode: ragEnabled ? "rag" : "none",
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
                traceType: "council",
                model: process.env.OPENAI_MODEL ?? "gpt-5-mini",
                promptVersion: "inner-council-v1",
                outputJson: councilRun,
                validationStatus: "validated",
              },
              ...retrievalTraceCreates,
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
          data: {
            userId: user.id,
            journalEntryId: journalEntry.id,
            level: prompt.level,
            title: prompt.title,
            context: prompt.context,
            materials: prompt.materialsAndPreparation,
            execution: prompt.execution,
            integration: prompt.integration,
            targetPattern: prompt.targetPattern,
          },
        }),
        shouldWritePatternMemory(user.patternMemoryEnabled)
          ? updatePatternMemory(user.id, journalEntry.id, analysis)
          : Promise.resolve(),
      ])

      const progression = await checkAndAdvanceProgression(
        user.id,
        user.currentLevel,
        user.avatarStage,
      )

      return NextResponse.json({
        journalEntry,
        safety,
        analysis: storedAnalysis,
        avatarResponse,
        prompt: generatedPrompt,
        progression,
        councilSession,
        sourceProvenance: {
          sourceMode: ragEnabled && sourceContext.length > 0 ? "rag" : "none",
          message: ragEnabled && sourceContext.length > 0
            ? "Grounded with approved source material."
            : "No approved source material was used for this reflection.",
          sources: sourceContext.map((chunk) => ({
            id: chunk.id,
            title: chunk.title,
            rank: chunk.rank,
            allowedUse: chunk.allowedUse,
            displayExcerpt: chunk.displayExcerpt,
          })),
        },
      })
    }

    const [storedAnalysis, avatar, prompt] = await Promise.all([
      prisma.entryAnalysis.create({
        data: {
          userId: user.id,
          journalEntryId: journalEntry.id,
          emotionalSignals: analysis.emotionalSignals,
          languageMarkers: analysis.languageMarkers,
          behavioralPatterns: analysis.behavioralPatterns,
          contradictionSignals: analysis.contradictionSignals,
          avoidanceSignals: analysis.avoidanceSignals,
          intensityScore: analysis.emotionalSignals.intensity,
          suggestedLevel: analysis.suggestedLevel,
          safetyFlags: analysis.safetyFlags,
          summary: analysis.summary,
        },
      }),
      generateAvatarResponse(body.text, analysis, safety, {
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
        data: {
          userId: user.id,
          journalEntryId: journalEntry.id,
          level: prompt.level,
          title: prompt.title,
          context: prompt.context,
          materials: prompt.materialsAndPreparation,
          execution: prompt.execution,
          integration: prompt.integration,
          targetPattern: prompt.targetPattern,
        },
      }),
      shouldWritePatternMemory(user.patternMemoryEnabled)
        ? updatePatternMemory(user.id, journalEntry.id, analysis)
        : Promise.resolve(),
    ])

    const progression = await checkAndAdvanceProgression(
      user.id,
      user.currentLevel,
      user.avatarStage,
    )

    return NextResponse.json({
      journalEntry,
      safety,
      analysis: storedAnalysis,
      avatarResponse,
      prompt: generatedPrompt,
      progression,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to analyze journal entry."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}

async function isFeatureEnabled(key: string, defaultValue: boolean) {
  const flag = await prisma.featureFlag.findUnique({
    where: { key },
    select: { enabled: true },
  })

  return flag?.enabled ?? defaultValue
}
