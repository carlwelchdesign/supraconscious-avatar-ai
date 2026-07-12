import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import { SUPPORTED_LANGUAGE_DETAILS, type SupportedLanguage } from "@inner-avatar/types/language"
import {
  GUIDE_STAGE_TRANSLATION_FIELDS,
  type GuideStageDisplayConfig,
  type GuideStageTranslation,
  type GuideStageTranslations,
} from "./guide-stage-config.js"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"

export const GUIDE_STAGE_TRANSLATION_LANGUAGES = ["es", "el", "fr", "de", "zh-Hans"] as const
export type GuideStageTranslationLanguage = (typeof GUIDE_STAGE_TRANSLATION_LANGUAGES)[number]

const GuideStageTranslationSchema = z.object(
  Object.fromEntries(GUIDE_STAGE_TRANSLATION_FIELDS.map((field) => [field, z.string().trim().min(1)])) as Record<
    (typeof GUIDE_STAGE_TRANSLATION_FIELDS)[number],
    z.ZodString
  >,
).strict()

const GuideStageTranslationsByLanguageSchema = z.object({
  es: GuideStageTranslationSchema,
  el: GuideStageTranslationSchema,
  fr: GuideStageTranslationSchema,
  de: GuideStageTranslationSchema,
  "zh-Hans": GuideStageTranslationSchema,
}).strict()

const GuideStageTranslationResultSchema = z.object({
  stages: z.array(z.object({
    stage: z.number().int().min(1).max(5),
    translations: GuideStageTranslationsByLanguageSchema,
  }).strict()).length(5),
}).strict()

export type GuideStageTranslationResult = z.infer<typeof GuideStageTranslationResultSchema>

export class GuideStageTranslationUnavailableError extends Error {
  constructor() {
    super("AI guide stage translation is not configured.")
    this.name = "GuideStageTranslationUnavailableError"
  }
}

export function parseGuideStageTranslationResult(value: unknown): GuideStageTranslationResult {
  const parsed = GuideStageTranslationResultSchema.parse(value)
  const seenStages = new Set(parsed.stages.map((stage) => stage.stage))
  if (seenStages.size !== 5 || ![1, 2, 3, 4, 5].every((stage) => seenStages.has(stage))) {
    throw new Error("Guide stage translation result must include each stage from 1 through 5 exactly once.")
  }
  return parsed
}

export async function translateGuideStages(stages: GuideStageDisplayConfig[]): Promise<GuideStageTranslationResult> {
  if (!isOpenAIConfigured()) {
    throw new GuideStageTranslationUnavailableError()
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `Translate guide-stage CMS copy for Supraconscious.
Return structured JSON only.
Translate user-facing copy naturally for each target language.
Preserve brand and product terms such as "Supraconscious".
Preserve the stage numbers exactly.
Do not add fields, omit fields, summarize, or explain.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          targetLanguages: Object.fromEntries(
            GUIDE_STAGE_TRANSLATION_LANGUAGES.map((language) => [
              language,
              SUPPORTED_LANGUAGE_DETAILS[language as SupportedLanguage].aiLanguageName,
            ]),
          ),
          fields: GUIDE_STAGE_TRANSLATION_FIELDS,
          stages: stages.map((stage) => ({
            stage: stage.stage,
            sourceLanguage: "English",
            fields: Object.fromEntries(GUIDE_STAGE_TRANSLATION_FIELDS.map((field) => [field, stage[field]])),
          })),
        }),
      },
    ],
    text: {
      format: zodTextFormat(GuideStageTranslationResultSchema, "guide_stage_translations"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Guide stage translator returned no structured output.")
  }

  return parseGuideStageTranslationResult(response.output_parsed)
}

export function readGeneratedStageTranslations(
  result: GuideStageTranslationResult,
  stageNumber: number,
): GuideStageTranslations {
  const stage = result.stages.find((item) => item.stage === stageNumber)
  if (!stage) return {}

  return Object.fromEntries(
    GUIDE_STAGE_TRANSLATION_LANGUAGES.map((language) => [
      language,
      stage.translations[language] satisfies GuideStageTranslation,
    ]),
  ) as GuideStageTranslations
}
