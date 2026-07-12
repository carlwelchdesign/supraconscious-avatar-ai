import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { getGuideStageConfigs, type GuideStageDisplayConfig, type GuideStageTranslationField } from "@inner-avatar/ai"
import { prisma } from "@inner-avatar/db"
import { SUPPORTED_LANGUAGE_DETAILS, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@inner-avatar/types/language"
import { AdminStatusBanner } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
import { upsertAvatarStageAction } from "../avatar-stages/actions"

const STAGE_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  saved: { tone: "success", message: "Guide stage saved." },
  invalid: { tone: "error", message: "Guide stage needs a stage number from 1 to 5, name, and reason." },
}

export default async function GuideStagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? STAGE_STATUS_MESSAGES[status] : null
  const stages = await getGuideStageConfigs(prisma, "en")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Guide Stages</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          CMS copy for the five visible guide stages used across the web app. Missing or inactive database records fall back to the built-in defaults shown here.
        </p>
      </div>
      <AdminStatusBanner message={statusMessage} />
      <div className="space-y-3">
        {stages.map((stage) => (
          <Card key={stage.stage}>
            <CardHeader>
              <CardTitle>Stage {stage.stage}: {stage.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                This copy appears wherever the app labels stage {stage.stage}, including the guide page, dashboard, sidebar, and journal views.
              </p>
            </CardHeader>
            <CardContent>
              <form action={upsertAvatarStageAction} className="grid gap-3 md:grid-cols-2">
                <input type="hidden" name="stage" value={stage.stage} />
                <StageLanguageFields stage={stage} language="en" />
                {SUPPORTED_LANGUAGES.filter((language) => language !== "en").map((language) => (
                  <StageLanguageFields key={language} stage={stage} language={language} />
                ))}
                <label className="grid gap-1 text-xs font-medium md:col-span-2">
                  Reason
                  <Input name="reason" placeholder="Reason required" required minLength={10} />
                </label>
                <SubmitButton className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50" pendingLabel="Saving stage...">
                  Save stage {stage.stage}
                </SubmitButton>
              </form>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function StageLanguageFields({
  stage,
  language,
}: {
  stage: GuideStageDisplayConfig
  language: SupportedLanguage
}) {
  const languageDetails = SUPPORTED_LANGUAGE_DETAILS[language]
  const prefix = language === "en" ? "" : `${language}__`

  return (
    <fieldset className="grid gap-3 rounded-lg border p-4 md:col-span-2 md:grid-cols-2">
      <legend className="px-1 text-xs font-semibold">
        {languageDetails.flag} {languageDetails.label}
      </legend>
      <label className="grid gap-1 text-xs font-medium">
        Stage name
        <Input name={`${prefix}name`} defaultValue={readStageField(stage, language, "name")} required={language === "en"} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Trait label
        <Input name={`${prefix}trait`} defaultValue={readStageField(stage, language, "trait")} />
      </label>
      <label className="grid gap-1 text-xs font-medium md:col-span-2">
        Stage description
        <Textarea name={`${prefix}description`} defaultValue={readStageField(stage, language, "description")} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Guide eyebrow
        <Input name={`${prefix}guideEyebrow`} defaultValue={readStageField(stage, language, "guideEyebrow")} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Timeline title
        <Input name={`${prefix}timelineTitle`} defaultValue={readStageField(stage, language, "timelineTitle")} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Guide title
        <Input name={`${prefix}guideTitle`} defaultValue={readStageField(stage, language, "guideTitle")} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Guide title emphasis
        <Input name={`${prefix}guideTitleEmphasis`} defaultValue={readStageField(stage, language, "guideTitleEmphasis")} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Current stage label
        <Input name={`${prefix}currentLabel`} defaultValue={readStageField(stage, language, "currentLabel")} />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Completed stage label
        <Input name={`${prefix}completedLabel`} defaultValue={readStageField(stage, language, "completedLabel")} />
      </label>
      <label className="grid gap-1 text-xs font-medium md:col-span-2">
        Guide intro
        <Textarea name={`${prefix}guideIntro`} defaultValue={readStageField(stage, language, "guideIntro")} />
      </label>
    </fieldset>
  )
}

function readStageField(
  stage: GuideStageDisplayConfig,
  language: SupportedLanguage,
  field: GuideStageTranslationField,
) {
  if (language === "en") return stage[field]
  return stage.translations?.[language]?.[field] ?? ""
}
