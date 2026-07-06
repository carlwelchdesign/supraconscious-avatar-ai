import { NextResponse } from "next/server"
import { prisma } from "@inner-avatar/db"
import { buildHealthPayload, HEALTH_RESPONSE_HEADERS } from "@/lib/health-response"

export async function GET() {
  try {
    await prisma.user.count()
    return NextResponse.json(buildHealthPayload("inner-avatar-admin", "ok"), { headers: HEALTH_RESPONSE_HEADERS })
  } catch {
    return NextResponse.json(
      buildHealthPayload("inner-avatar-admin", "error"),
      { status: 503, headers: HEALTH_RESPONSE_HEADERS },
    )
  }
}
