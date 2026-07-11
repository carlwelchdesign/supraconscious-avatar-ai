import { z } from "zod"
import {
  classifyJournalSafety,
  generateSymbolicPrompt,
  resolveResponseLanguage,
} from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { getJournalAccessError, requireJournalAccessUser } from "@/lib/journal-access"
import { getOrCreateEntryAnalysis, resolveLegacyJournalEntry } from "@/lib/legacy-reflection"
import { buildLegacyPromptResponse } from "@/lib/legacy-reflection-response"
import { readPrivateApiError } from "@/lib/private-api-error"
import { privateJson } from "@/lib/private-json"

const GeneratePromptSchema = z.object({
  journalEntryId: z.string().min(1).optional(),
  entryId: z.string().min(1).optional(),
  text: z.string().trim().min(20, "Write at least 20 characters before generating a prompt.").optional(),
}).refine((data) => data.journalEntryId || data.entryId || data.text, {
  message: "Provide journalEntryId, entryId, or text.",
})

export async function POST(request: Request) {
  try {
    const user = await requireJournalAccessUser()
    const body = GeneratePromptSchema.parse(await request.json())
    const journalEntry = await resolveLegacyJournalEntry({
      userId: user.id,
      journalEntryId: body.journalEntryId ?? body.entryId,
      text: body.text,
    })

    const responseLanguage = resolveResponseLanguage(user.preferredLanguage)
    const safety = await classifyJournalSafety(journalEntry.rawText, responseLanguage)
    const analysis = await getOrCreateEntryAnalysis({ userId: user.id, journalEntry, safety })
    const prompt = await generateSymbolicPrompt(analysis, safety, responseLanguage)

    const saved = await prisma.generatedPrompt.create({
      data: {
        userId: user.id,
        journalEntryId: journalEntry.id,
        level: prompt.level,
        title: prompt.title,
        context: prompt.context,
        materials: prompt.materialsAndPreparation,
        execution: prompt.execution,
        integration: prompt.integration,
        targetPattern: prompt.targetPattern,
      },
    })

    return privateJson(buildLegacyPromptResponse({
      journalEntryId: journalEntry.id,
      safety,
      analysis,
      prompt: saved,
    }))
  } catch (error) {
    const accessError = getJournalAccessError(error)
    if (accessError) {
      return privateJson({ error: accessError.error, code: accessError.code }, { status: accessError.status })
    }
    const apiError = readPrivateApiError(error, { fallback: "Unable to generate personalized prompt." })
    return privateJson({ error: apiError.error }, { status: apiError.status })
  }
}
