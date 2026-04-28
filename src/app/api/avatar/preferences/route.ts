import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

const PreferencesSchema = z.object({
  avatarTone: z.enum(["gentle", "balanced", "direct"]).optional(),
  intensityLevel: z.number().int().min(1).max(5).optional(),
  patternMemoryEnabled: z.boolean().optional(),
  topicsToAvoid: z.array(z.string()).optional(),
})

export async function PATCH(request: Request) {
  try {
    const user = await requireAppUser()
    const body = PreferencesSchema.parse(await request.json())

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: body,
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update preferences."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}
