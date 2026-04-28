import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireAppUser } from "@/lib/auth/user"
import { prisma } from "@/lib/db"

type PatternSummary = {
  id: string
  patternLabel: string
  evidenceCount: number
  confidence: number
}

export default async function PatternsPage() {
  const user = await requireAppUser()
  const patterns: PatternSummary[] = await prisma.patternMemory.findMany({
    where: { userId: user.id, active: true },
    orderBy: [{ evidenceCount: "desc" }, { lastSeenAt: "desc" }],
    select: {
      id: true,
      patternLabel: true,
      evidenceCount: true,
      confidence: true,
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal">Patterns</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
          Repeated themes are shown as reflective signals, not diagnoses.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {patterns.length ? (
          patterns.map((pattern) => (
            <Card key={pattern.id}>
              <CardHeader>
                <CardTitle>{pattern.patternLabel}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm leading-6">
                <p className="text-muted-foreground">Seen {pattern.evidenceCount} times</p>
                <p>Confidence: {Math.round(pattern.confidence * 100)}%</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Patterns appear after repeated entries. Nothing is labeled from a single moment.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
