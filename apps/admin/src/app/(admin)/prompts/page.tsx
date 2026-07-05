import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Button } from "@inner-avatar/ui/button"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { prisma } from "@inner-avatar/db"
import { DEFAULT_COUNCIL_PROMPT_KEY, DEFAULT_COUNCIL_SYSTEM_PROMPT, runFounderCalibrationReport } from "@inner-avatar/ai"
import { createPromptTemplateAction } from "./actions"

const PROMPT_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  saved: { tone: "success", message: "Prompt template saved." },
  invalid: { tone: "error", message: "Prompt template needs a valid key, name, content, and reason." },
  guardrails_missing: {
    tone: "error",
    message: "Council prompts must keep the required safety and identity guardrails before they can be saved.",
  },
}

export default async function PromptsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? PROMPT_STATUS_MESSAGES[status] : null
  const [templates, calibration] = await Promise.all([
    prisma.promptTemplate.findMany({
      orderBy: { updatedAt: "desc" },
      include: { createdBy: { select: { email: true } } },
      take: 50,
    }),
    runFounderCalibrationReport(),
  ])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Prompt Templates</h1>
      {statusMessage ? (
        <div
          className={[
            "rounded-md border p-3 text-sm",
            statusMessage.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "",
            statusMessage.tone === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "",
          ].filter(Boolean).join(" ")}
        >
          {statusMessage.message}
        </div>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader>
            <CardTitle>Create or Update Template</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={createPromptTemplateAction} className="grid gap-3">
              <Input name="key" placeholder="template.key" defaultValue={DEFAULT_COUNCIL_PROMPT_KEY} required />
              <Input name="name" placeholder="Display name" defaultValue="Council system prompt" required />
              <Input name="description" placeholder="Description" defaultValue="Versioned Inner Council system prompt for founder calibration tuning." />
              <Textarea name="content" placeholder="Prompt content" className="min-h-52" defaultValue={DEFAULT_COUNCIL_SYSTEM_PROMPT} required />
              <Input name="relatedCalibrationSessionIds" placeholder="Related calibration session ids, comma or space separated" />
              <Input name="reason" placeholder="Reason for this prompt update" required />
              <Button type="submit">Save template</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Founder Calibration Evidence</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Golden examples</p>
              <p className="text-2xl font-semibold">{calibration.goldenExamples.length}</p>
              <p className="text-xs text-muted-foreground">Ready sessions are examples, not training data.</p>
            </div>
            <div>
              <p className="font-medium">Prompt and voice issues</p>
              <p className="text-2xl font-semibold">{calibration.promptIssues.length}</p>
              <p className="text-xs text-muted-foreground">Use these as evidence before changing `council.system`.</p>
            </div>
            <div className="space-y-2">
              <p className="font-medium">Top themes</p>
              {calibration.feedbackThemes.slice(0, 5).length === 0 ? (
                <p className="text-xs text-muted-foreground">No calibration themes yet.</p>
              ) : calibration.feedbackThemes.slice(0, 5).map((theme) => (
                <p key={theme.theme} className="rounded-md border px-3 py-2 text-xs text-muted-foreground">
                  {theme.theme} · {theme.count}
                </p>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-3">
        {templates.map((template) => (
          <Card key={template.id}>
            <CardHeader>
              <CardTitle>{template.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="text-muted-foreground">{template.key} · v{template.version} · {template.active ? "active" : "inactive"}</p>
              {template.description ? <p>{template.description}</p> : null}
              <pre className="max-h-52 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">{template.content}</pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
