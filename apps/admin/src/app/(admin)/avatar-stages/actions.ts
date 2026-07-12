"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  GUIDE_STAGE_TRANSLATION_FIELDS,
  GUIDE_STAGE_TRANSLATION_LANGUAGES,
  GuideStageTranslationUnavailableError,
  getGuideStageConfigs,
  readGeneratedStageTranslations,
  translateGuideStages,
  type GuideStageDisplayConfig,
  type GuideStageTranslation,
  type GuideStageTranslations,
} from "@inner-avatar/ai"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@inner-avatar/types/language"

const AvatarStageSchema = z.object({
  stage: z.coerce.number().int().min(1).max(5),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().optional(),
  trait: z.string().trim().optional(),
  guideEyebrow: z.string().trim().optional(),
  guideTitle: z.string().trim().optional(),
  guideTitleEmphasis: z.string().trim().optional(),
  guideIntro: z.string().trim().optional(),
  timelineTitle: z.string().trim().optional(),
  currentLabel: z.string().trim().optional(),
  completedLabel: z.string().trim().optional(),
  reason: z.string().trim().min(10, "A guide stage change reason is required."),
})

export async function upsertAvatarStageAction(formData: FormData) {
  const actor = await requireAdminUser()
  const entries = Object.fromEntries(formData)
  const parsed = AvatarStageSchema.safeParse(entries)
  if (!parsed.success) {
    redirect("/guide-stages?status=invalid")
  }

  const metadata = buildStageMetadata(parsed.data, entries)
  const stage = await prisma.avatarStageConfig.upsert({
    where: { stage: parsed.data.stage },
    create: {
      stage: parsed.data.stage,
      name: parsed.data.name,
      description: parsed.data.description,
      metadata,
    },
    update: {
      name: parsed.data.name,
      description: parsed.data.description,
      metadata,
      active: true,
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "avatar_stage_config.upsert",
      targetType: "AvatarStageConfig",
      targetId: stage.id,
      reason: parsed.data.reason,
      metadata: {
        stage: stage.stage,
        fields: ["name", "description", "trait", "guideEyebrow", "guideTitle", "guideTitleEmphasis", "guideIntro", "timelineTitle", "currentLabel", "completedLabel"],
        languages: readTranslatedLanguages(metadata.translations),
      },
    },
  })

  revalidatePath("/guide-stages")
  revalidatePath("/avatar-stages")
  revalidatePath("/guide")
  revalidatePath("/dashboard")
  revalidatePath("/journal")
  redirect("/guide-stages?status=saved")
}

export async function translateAllGuideStagesAction() {
  const actor = await requireAdminUser()
  const stages = await getGuideStageConfigs(prisma, "en")

  try {
    const result = await translateGuideStages(stages)

    await prisma.$transaction(async (tx) => {
      const savedStages = []
      for (const stage of stages) {
        const translations = readGeneratedStageTranslations(result, stage.stage)
        const savedStage = await tx.avatarStageConfig.upsert({
          where: { stage: stage.stage },
          create: {
            stage: stage.stage,
            name: stage.name,
            description: stage.description,
            metadata: buildStageMetadataFromConfig(stage, translations),
          },
          update: {
            name: stage.name,
            description: stage.description,
            metadata: buildStageMetadataFromConfig(stage, translations),
            active: true,
          },
          select: { id: true, stage: true },
        })
        savedStages.push(savedStage.stage)
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "avatar_stage_config.translate_all",
          targetType: "AvatarStageConfig",
          reason: "Generated guide stage translations from admin Translate all.",
          metadata: {
            stages: savedStages,
            languages: GUIDE_STAGE_TRANSLATION_LANGUAGES,
            fields: GUIDE_STAGE_TRANSLATION_FIELDS,
            overwrite: true,
          },
        },
      })
    })
  } catch (error) {
    if (error instanceof GuideStageTranslationUnavailableError) {
      redirect("/guide-stages?status=translation_unavailable")
    }
    console.error("Guide stage translation failed", error)
    redirect("/guide-stages?status=translation_failed")
  }

  revalidatePath("/guide-stages")
  revalidatePath("/avatar-stages")
  revalidatePath("/guide")
  revalidatePath("/dashboard")
  revalidatePath("/journal")
  redirect("/guide-stages?status=translated")
}

function buildStageMetadata(data: z.infer<typeof AvatarStageSchema>, entries: Record<string, FormDataEntryValue>) {
  const metadata = {
    trait: data.trait,
    guideEyebrow: data.guideEyebrow,
    guideTitle: data.guideTitle,
    guideTitleEmphasis: data.guideTitleEmphasis,
    guideIntro: data.guideIntro,
    timelineTitle: data.timelineTitle,
    currentLabel: data.currentLabel,
    completedLabel: data.completedLabel,
    translations: buildStageTranslations(entries),
  }
  return Object.fromEntries(
    Object.entries(metadata).filter(([, value]) =>
      typeof value === "string"
        ? value.trim().length > 0
        : value && typeof value === "object" && Object.keys(value).length > 0,
    ),
  )
}

function buildStageMetadataFromConfig(stage: GuideStageDisplayConfig, translations: GuideStageTranslations) {
  return {
    trait: stage.trait,
    guideEyebrow: stage.guideEyebrow,
    guideTitle: stage.guideTitle,
    guideTitleEmphasis: stage.guideTitleEmphasis,
    guideIntro: stage.guideIntro,
    timelineTitle: stage.timelineTitle,
    currentLabel: stage.currentLabel,
    completedLabel: stage.completedLabel,
    translations,
  }
}

function buildStageTranslations(entries: Record<string, FormDataEntryValue>): GuideStageTranslations {
  const translations: GuideStageTranslations = {}

  for (const language of SUPPORTED_LANGUAGES) {
    if (language === "en") continue

    const translation: GuideStageTranslation = {}
    for (const field of GUIDE_STAGE_TRANSLATION_FIELDS) {
      const value = readFormText(entries[translationFieldName(language, field)])
      if (value) translation[field] = value
    }

    if (Object.keys(translation).length > 0) {
      translations[language] = translation
    }
  }

  return translations
}

function translationFieldName(language: SupportedLanguage, field: string) {
  return `${language}__${field}`
}

function readTranslatedLanguages(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return []
  return Object.keys(value)
}

function readFormText(value: FormDataEntryValue | undefined) {
  return typeof value === "string" && value.trim() ? value.trim() : null
}
