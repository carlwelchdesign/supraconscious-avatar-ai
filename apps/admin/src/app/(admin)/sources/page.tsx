import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { updateCurriculumDayStateAction, updateSourceDocumentStateAction } from "./actions"

const SOURCE_STATES = ["imported", "parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]
const RIGHTS_STATES = ["needs_review", "approved", "paraphrase_only", "blocked"]
const CURRICULUM_STATES = ["needs_review", "approved_curriculum", "deprecated", "blocked"]

export default async function SourcesPage() {
  const [documents, curriculumDays, chunks] = await Promise.all([
    prisma.sourceDocument.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        sourceType: true,
        rightsStatus: true,
        reviewState: true,
        updatedAt: true,
        _count: { select: { chunks: true, sections: true, curriculumDays: true } },
      },
    }),
    prisma.curriculumDay.findMany({
      orderBy: [{ month: "asc" }, { day: "asc" }],
      take: 40,
      select: {
        id: true,
        month: true,
        day: true,
        theme: true,
        publishState: true,
        socraticQuestion: true,
      },
    }),
    prisma.sourceChunk.count({ where: { reviewState: { in: ["approved", "approved_curriculum"] } } }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metadata-first review for Maria source material, curriculum, and retrieval chunks.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{documents.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Curriculum Days</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{curriculumDays.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Approved Chunks</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{chunks}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Source Documents</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source documents imported yet.</p>
          ) : documents.map((document) => (
            <div key={document.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{document.title}</p>
                <p className="text-xs text-muted-foreground">
                  {document.sourceType} · {document.reviewState} · {document.rightsStatus}
                </p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {document._count.sections} sections · {document._count.chunks} chunks · {document._count.curriculumDays} curriculum days
              </p>
              <form action={updateSourceDocumentStateAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="sourceDocumentId" value={document.id} />
                <select name="reviewState" defaultValue={document.reviewState} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {SOURCE_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <select name="rightsStatus" defaultValue={document.rightsStatus} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {RIGHTS_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                  Update
                </button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Curriculum Preview</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {curriculumDays.length === 0 ? (
            <p className="text-sm text-muted-foreground">No curriculum days parsed yet.</p>
          ) : curriculumDays.map((day) => (
            <div key={day.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">Month {day.month}, Day {day.day}: {day.theme}</p>
              <p className="mt-1 text-xs text-muted-foreground">{day.publishState}</p>
              <p className="mt-2 text-sm">{day.socraticQuestion}</p>
              <form action={updateCurriculumDayStateAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="curriculumDayId" value={day.id} />
                <select name="publishState" defaultValue={day.publishState} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {CURRICULUM_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                  Save state
                </button>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
