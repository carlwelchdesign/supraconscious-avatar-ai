import { z } from "zod"
import {
  FounderCalibrationScenarioSchema,
  runActiveReflection,
  type ActiveReflectionUser,
} from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"

const RunSupraconsciousReflectionSchema = z.object({
  text: z.string().trim().min(20, "Write at least 20 characters before reflecting."),
  inputMode: z.enum(["text", "voice"]).default("text"),
  calibrationScenario: FounderCalibrationScenarioSchema.optional().default("freeform"),
})

type RunSupraconsciousReflectionDeps = {
  prisma?: typeof prisma
  runActiveReflection?: typeof runActiveReflection
}

type ActiveReflectionResult = Awaited<ReturnType<typeof runActiveReflection>> & {
  councilSession?: {
    id: string
    messages: Array<{
      role: string
      displayName: string
      content: string
      abstained: boolean
    }>
    synthesis?: {
      integratorQuestion: string
      integrationStep: string
    } | null
  }
  sourceProvenance?: {
    sourceMode: string
    message: string
    sources: Array<{
      id: string
      title: string
      rank: number
      allowedUse: string
      displayExcerpt: string | null
    }>
  }
}

export async function runSupraconsciousReflection(
  input: unknown,
  userId: string,
  deps: RunSupraconsciousReflectionDeps = {},
) {
  const { prisma: prismaClient = prisma, runActiveReflection: runReflection = runActiveReflection } = deps

  try {
    const validatedInput = RunSupraconsciousReflectionSchema.parse(input)
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarTone: true,
        intensityLevel: true,
        currentLevel: true,
        avatarStage: true,
        patternMemoryEnabled: true,
      },
    })

    if (!user) throw new Error("Authenticated user not found")

    const reflectionUser: ActiveReflectionUser = user
    const result = await runReflection(reflectionUser, {
      text: validatedInput.text,
      inputMode: validatedInput.inputMode,
      calibrationScenario: validatedInput.calibrationScenario,
    }) as ActiveReflectionResult

    return {
      pilotScope: "This uses the same reflection flow as the web journal. The Guide follows the versioned Supraconscious doctrine; it is not therapy, crisis monitoring, or spiritual authority.",
      journalEntryId: result.journalEntry.id,
      safety: {
        severity: result.safety.severity,
        flags: result.safety.flags,
        allowReflectiveFlow: result.safety.allowReflectiveFlow,
      },
      avatarResponse: result.avatarResponse,
      councilSession: result.councilSession
        ? {
            id: result.councilSession.id,
            sourceMode: result.sourceProvenance?.sourceMode ?? "none",
            messages: result.councilSession.messages.map((message) => ({
              role: message.role,
              displayName: message.displayName,
              content: message.abstained ? "This voice was quiet while grounding came first." : message.content,
              abstained: message.abstained,
            })),
            integratorQuestion: result.councilSession.synthesis?.integratorQuestion ?? null,
            integrationStep: result.councilSession.synthesis?.integrationStep ?? null,
          }
        : null,
      sourceProvenance: result.sourceProvenance
        ? {
            sourceMode: result.sourceProvenance.sourceMode,
            message: result.sourceProvenance.message,
            sources: result.sourceProvenance.sources.map((source) => ({
              id: source.id,
              title: source.title,
              rank: source.rank,
              allowedUse: source.allowedUse,
              displayExcerpt: source.displayExcerpt,
            })),
          }
        : {
            sourceMode: "none",
            message: "No approved source material was used for this reflection.",
            sources: [],
          },
      prompt: result.prompt,
      progression: result.progression,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Invalid input: ${error.message}`)
    }
    if (error instanceof Error && error.message.includes("Authenticated user not found")) {
      throw error
    }
    throw new Error("Failed to run Supraconscious reflection")
  }
}
