import { NextResponse } from "next/server"
import { JournalAnalyzeRequestSchema, runCouncilReflection } from "@inner-avatar/ai"
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

    const result = await runCouncilReflection({
      id: user.id,
      avatarTone: user.avatarTone,
      intensityLevel: user.intensityLevel,
      currentLevel: user.currentLevel,
      avatarStage: user.avatarStage,
      patternMemoryEnabled: user.patternMemoryEnabled,
    }, {
      text: body.text,
      inputMode: body.inputMode,
      calibrationScenario: body.calibrationScenario,
      councilModeEnabled,
      ragEnabled,
      requestId: request.headers.get("x-request-id") ?? undefined,
    })

    return NextResponse.json(result)
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
