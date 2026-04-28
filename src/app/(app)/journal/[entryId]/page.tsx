import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

export default async function JournalEntryPage({ params }: { params: Promise<{ entryId: string }> }) {
  const user = await requireAppUser()
  const { entryId } = await params
  const entry = await prisma.journalEntry.findFirst({
    where: { id: entryId, userId: user.id },
    include: { analysis: true, avatarResponse: true, generatedPrompts: true },
  })

  if (!entry) notFound()

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Entry</CardTitle>
        </CardHeader>
        <CardContent className="whitespace-pre-wrap text-sm leading-7">{entry.rawText}</CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Reflection</CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-7 text-muted-foreground">
          {entry.avatarResponse?.mirror ?? "No reflection is attached to this entry."}
        </CardContent>
      </Card>
    </div>
  )
}
