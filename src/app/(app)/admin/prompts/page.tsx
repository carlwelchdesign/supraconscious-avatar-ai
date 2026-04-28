import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAdminUser } from "@/lib/auth/session"
import { prisma } from "@/lib/db"

export default async function AdminPromptsPage() {
  await requireAdminUser()
  const prompts = await prisma.generatedPrompt.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { email: true } } },
    take: 50,
  })

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold tracking-normal">Prompt Management</h1>
      <div className="space-y-3">
        {prompts.length ? (
          prompts.map((prompt) => (
            <Card key={prompt.id}>
              <CardHeader>
                <CardTitle>{prompt.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6">
                <p className="text-muted-foreground">{prompt.user.email}</p>
                <p>{prompt.context}</p>
                <p className="text-muted-foreground">Level {prompt.level}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Generated prompts will appear here once users complete reflections.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
