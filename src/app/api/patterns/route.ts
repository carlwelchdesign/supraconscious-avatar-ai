import { NextResponse } from "next/server"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

export async function GET() {
  try {
    const user = await requireAppUser()
    const [patterns, recentEntries] = await Promise.all([
      prisma.patternMemory.findMany({
        where: { userId: user.id, active: true },
        orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
        take: 12,
      }),
      prisma.journalEntry.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          analysis: true,
          avatarResponse: true,
          generatedPrompts: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      }),
    ])

    return NextResponse.json({ patterns, recentEntries })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load patterns."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}
