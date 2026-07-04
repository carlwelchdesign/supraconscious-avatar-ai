import { NextResponse } from "next/server"
import { z } from "zod"
import { emitPilotEvent, isFounderCalibrationUser } from "@inner-avatar/ai"
import { requireAppUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { isFounderCalibrationFeedbackNoteUseful } from "@/lib/founder-feedback"

const FeedbackRequestSchema = z.object({
  councilSessionId: z.string().min(1),
  feedbackType: z.enum(["helpful", "not_accurate", "too_intense", "unclear", "unsupported_source"]),
  note: z.string().trim().max(500).optional(),
})

export async function POST(request: Request) {
  try {
    const user = await requireAppUser()
    const body = FeedbackRequestSchema.parse(await request.json())
    const founderCalibrationMode = await isFounderCalibrationUser(user.email)
    if (founderCalibrationMode && !isFounderCalibrationFeedbackNoteUseful(body.note)) {
      return NextResponse.json({ error: "Founder calibration feedback needs a short specific note." }, { status: 400 })
    }

    const session = await prisma.councilSession.findFirst({
      where: { id: body.councilSessionId, userId: user.id },
      select: { id: true, journalEntryId: true, sourceMode: true, safetySnapshot: true },
    })

    if (!session) {
      return NextResponse.json({ error: "Council session not found." }, { status: 404 })
    }

    const feedback = await prisma.councilSessionFeedback.create({
      data: {
        userId: user.id,
        councilSessionId: session.id,
        feedbackType: body.feedbackType,
        note: body.note,
      },
    })

    const safety = session.safetySnapshot as { severity?: string }
    await emitPilotEvent({
      eventName: "user_feedback_submitted",
      userId: user.id,
      journalEntryId: session.journalEntryId,
      councilSessionId: session.id,
      sourceMode: session.sourceMode,
      safetySeverity: safety.severity ?? "unknown",
      properties: { feedbackType: body.feedbackType, hasNote: Boolean(body.note) },
    })

    return NextResponse.json({ feedback })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save feedback."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}
