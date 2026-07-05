import { NextResponse } from "next/server"
import { z } from "zod"
import { emitPilotEvent } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const EmbodimentRequestSchema = z.object({
  councilSessionId: z.string().min(1),
  journalEntryId: z.string().min(1).optional(),
  text: z.string().trim().min(3, "Write one small shift before crossing the gate."),
})

export async function POST(request: Request) {
  try {
    const user = await requireAppUser()
    const body = EmbodimentRequestSchema.parse(await request.json())

    const session = await prisma.councilSession.findFirst({
      where: {
        id: body.councilSessionId,
        userId: user.id,
      },
      select: { id: true, journalEntryId: true, sourceMode: true, safetySnapshot: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Council session not found." }, { status: 404 })
    }

    const response = await prisma.embodimentGateResponse.create({
      data: {
        userId: user.id,
        councilSessionId: session.id,
        journalEntryId: session.journalEntryId,
        text: body.text,
      },
    })

    const safety = session.safetySnapshot as { severity?: string }
    await emitPilotEvent({
      eventName: "embodiment_gate_saved",
      userId: user.id,
      journalEntryId: session.journalEntryId,
      councilSessionId: session.id,
      sourceMode: session.sourceMode,
      safetySeverity: safety.severity ?? "unknown",
      properties: { responseLength: body.text.length },
    })

    return NextResponse.json({ response })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save embodiment response."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}
