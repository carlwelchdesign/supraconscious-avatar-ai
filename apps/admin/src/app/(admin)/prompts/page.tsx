import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { Button } from "@inner-avatar/ui/button"
import { Input } from "@inner-avatar/ui/input"
import { Textarea } from "@inner-avatar/ui/textarea"
import { prisma } from "@inner-avatar/db"
import { createPromptTemplateAction } from "./actions"

export default async function PromptsPage() {
  const templates = await prisma.promptTemplate.findMany({
    orderBy: { updatedAt: "desc" },
    include: { createdBy: { select: { email: true } } },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Prompt Templates</h1>
      <Card>
        <CardHeader>
          <CardTitle>Create or Update Template</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createPromptTemplateAction} className="grid gap-3">
            <Input name="key" placeholder="template.key" required />
            <Input name="name" placeholder="Display name" required />
            <Input name="description" placeholder="Description" />
            <Textarea name="content" placeholder="Prompt content" className="min-h-32" required />
            <Button type="submit">Save template</Button>
          </form>
        </CardContent>
      </Card>
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
