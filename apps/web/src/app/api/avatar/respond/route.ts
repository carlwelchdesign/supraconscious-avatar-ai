import { z } from "zod"
import {
  classifyJournalSafety,
  generateAvatarResponse,
  resolveResponseLanguage,
} from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { getOrCreateEntryAnalysis, resolveLegacyJournalEntry } from "@/lib/legacy-reflection"
import { buildLegacyAvatarResponse } from "@/lib/legacy-reflection-response"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const AvatarRespondSchema = z.object({
  journalEntryId: z.string().min(1).optional(),
  entryId: z.string().min(1).optional(),
  text: z.string().trim().min(20, "Write at least 20 characters before reflecting.").optional(),
}).refine((data) => data.journalEntryId || data.entryId || data.text, {
  message: "Provide journalEntryId, entryId, or text.",
})

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = AvatarRespondSchema.parse(await request.json())
    const journalEntry = await resolveLegacyJournalEntry({
      userId: user.id,
      journalEntryId: body.journalEntryId ?? body.entryId,
      text: body.text,
    })

    const responseLanguage = resolveResponseLanguage(user.preferredLanguage)
    const safety = await classifyJournalSafety(journalEntry.rawText, responseLanguage)
    const analysis = await getOrCreateEntryAnalysis({ userId: user.id, journalEntry, safety })
    const avatarResponse = await generateAvatarResponse(journalEntry.rawText, analysis, safety, {
      tone: user.avatarTone,
      intensity: user.intensityLevel,
      currentLevel: user.currentLevel,
      avatarStage: user.avatarStage,
      language: responseLanguage,
    })

    const saved = await prisma.avatarResponse.upsert({
      where: { journalEntryId: journalEntry.id },
      update: avatarResponse,
      create: {
        journalEntryId: journalEntry.id,
        userId: user.id,
        ...avatarResponse,
      },
    })

    return privateJson(buildLegacyAvatarResponse({
      journalEntryId: journalEntry.id,
      safety,
      analysis,
      avatarResponse: saved,
    }))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to generate avatar response." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
