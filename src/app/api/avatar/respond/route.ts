import { NextResponse } from "next/server"

export async function POST() {
  return NextResponse.json(
    { error: "Avatar responses are generated through /api/journal/analyze in the MVP flow." },
    { status: 501 },
  )
}
