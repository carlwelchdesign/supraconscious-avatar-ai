import { NextResponse } from "next/server"

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "inner-avatar-web",
    environment: process.env.NODE_ENV ?? "unknown",
  })
}
