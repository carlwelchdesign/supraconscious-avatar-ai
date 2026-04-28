import { NextResponse } from "next/server"
import { z } from "zod"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

const CreateJournalEntrySchema = z.object({
  text: z.string().trim().min(1),
  inputMode: z.enum(["text", "voice"]).default("text"),
  isDraft: z.boolean().default(true),
})

export async function POST(request: Request) {
  try {
    const user = await requireAppUser()
    const body = CreateJournalEntrySchema.parse(await request.json())

    const journalEntry = await prisma.journalEntry.create({
      data: {
        userId: user.id,
        rawText: body.text,
        inputMode: body.inputMode,
        isDraft: body.isDraft,
      },
    })

    return NextResponse.json({ journalEntry })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create journal entry."
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" ? 401 : 400 })
  }
}
