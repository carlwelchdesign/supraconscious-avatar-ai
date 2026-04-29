import { NextResponse } from "next/server"
import { requireAppUser } from "@/lib/auth/user"
import { transcribeAudio } from "@/lib/voice/transcribe"

export async function POST(request: Request) {
  try {
    await requireAppUser()
    const formData = await request.formData()
    const audio = formData.get("audio") as Blob | null

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: "No audio received." }, { status: 400 })
    }
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ error: "Audio too large (max 25 MB)." }, { status: 400 })
    }

    const text = await transcribeAudio(audio)
    if (!text.trim()) {
      return NextResponse.json({ error: "No speech detected." }, { status: 422 })
    }

    return NextResponse.json({ text })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transcription failed."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 500 })
  }
}
