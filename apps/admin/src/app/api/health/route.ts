import { NextResponse } from "next/server"
import { prisma } from "@inner-avatar/db"

export async function GET() {
  try {
    await prisma.user.count()
    return NextResponse.json({
      ok: true,
      service: "inner-avatar-admin",
      database: "ok",
    }, { headers: { "Cache-Control": "no-store" } })
  } catch {
    return NextResponse.json(
      {
        ok: false,
        service: "inner-avatar-admin",
        database: "error",
      },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    )
  }
}
