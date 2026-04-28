import { NextResponse } from "next/server"
import { analyzeEntry } from "@/lib/ai/analyze-entry"
import { generateAvatarResponse } from "@/lib/ai/generate-avatar-response"
import { generateSymbolicPrompt } from "@/lib/ai/generate-symbolic-prompt"
import { updatePatternMemory } from "@/lib/ai/pattern-memory"
import { checkAndAdvanceProgression } from "@/lib/ai/progression"
import { classifyJournalSafety } from "@/lib/ai/safety-classifier"
import { JournalAnalyzeRequestSchema } from "@/lib/ai/schemas"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const user = await requireAppUser()
    const body = JournalAnalyzeRequestSchema.parse(await request.json())

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
      updatePatternMemory(user.id, journalEntry.id, analysis),
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
