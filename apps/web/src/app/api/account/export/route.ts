import { NextResponse } from "next/server"
import { buildAccountExportPayload, emitPilotEvent } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

export async function GET() {
  const user = await requireAppUser()
  const exportProfile = {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarTone: user.avatarTone,
    intensityLevel: user.intensityLevel,
    currentLevel: user.currentLevel,
    avatarStage: user.avatarStage,
    patternMemoryEnabled: user.patternMemoryEnabled,
    voiceEnabled: user.voiceEnabled,
    voiceAutoPlay: user.voiceAutoPlay,
    voiceInputDefault: user.voiceInputDefault,
    voiceGender: user.voiceGender,
    voiceStyle: user.voiceStyle,
    voiceSpeed: user.voiceSpeed,
  }

  const [
    journalEntries,
    patternMemories,
    councilSessions,
    safetyEvents,
    consentEvents,
    pilotEvents,
    subscriptions,
  ] = await Promise.all([
    prisma.journalEntry.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      include: {
        analysis: true,
        avatarResponse: true,
        generatedPrompts: true,
        embodimentGateResponses: true,
      },
    }),
    prisma.patternMemory.findMany({ where: { userId: user.id }, include: { feedback: true } }),
    prisma.councilSession.findMany({
      where: { userId: user.id },
      include: {
        messages: true,
        synthesis: true,
        embodimentGateResponses: true,
        feedback: true,
        generationTraces: {
          select: {
            id: true,
            sourceChunkId: true,
            traceType: true,
            model: true,
            promptVersion: true,
            inputHash: true,
            validationStatus: true,
            fallbackReason: true,
            createdAt: true,
            sourceChunk: {
              select: {
                id: true,
                sourceDocument: {
                  select: {
                    id: true,
                    title: true,
                    sourceType: true,
                    reviewState: true,
                  },
                },
              },
            },
          },
        },
      },
    }),
    prisma.safetyEvent.findMany({ where: { userId: user.id } }),
    prisma.consentEvent.findMany({ where: { userId: user.id } }),
    prisma.pilotEvent.findMany({
      where: { userId: user.id },
      orderBy: { occurredAt: "desc" },
      select: {
        id: true,
        eventName: true,
        eventVersion: true,
        occurredAt: true,
        properties: true,
        inputHash: true,
        sourceMode: true,
        safetySeverity: true,
        featureFlags: true,
        requestId: true,
      },
    }),
    prisma.subscription.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        stripePriceId: true,
        plan: true,
        status: true,
        currentPeriodStart: true,
        currentPeriodEnd: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
  ])

  const exportEvent = await emitPilotEvent({
    eventName: "data_export_requested",
    userId: user.id,
    properties: { entryCount: journalEntries.length, councilSessionCount: councilSessions.length },
  })

  return NextResponse.json(buildAccountExportPayload({
    exportedAt: new Date().toISOString(),
    user: exportProfile,
    journalEntries,
    patternMemories,
    councilSessions,
    safetyEvents,
    consentEvents,
    pilotEvents: [
      {
        id: exportEvent.id,
        eventName: exportEvent.eventName,
        eventVersion: exportEvent.eventVersion,
        occurredAt: exportEvent.occurredAt,
        properties: exportEvent.properties,
        inputHash: exportEvent.inputHash,
        sourceMode: exportEvent.sourceMode,
        safetySeverity: exportEvent.safetySeverity,
        featureFlags: exportEvent.featureFlags,
        requestId: exportEvent.requestId,
      },
      ...pilotEvents,
    ],
    subscriptions,
  }))
}
