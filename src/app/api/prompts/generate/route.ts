import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Personalized prompts are generated through /api/journal/analyze in the MVP flow." },
    { status: 501 },
  )
}
