import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { formatAdminDateTime } from "@/lib/date-format"
import {
  updateCurriculumDayStateAction,
  updateSourceChunkStateAction,
  updateSourceDocumentStateAction,
  upsertSourceRightsGrantAction,
} from "./actions"

const SOURCE_STATES = ["imported", "parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]
const RIGHTS_STATES = ["needs_review", "approved", "paraphrase_only", "blocked"]
const CURRICULUM_STATES = ["needs_review", "approved_curriculum", "deprecated", "blocked"]
const CHUNK_STATES = ["parsed", "needs_review", "approved", "approved_curriculum", "deprecated", "blocked"]
const QUOTE_PERMISSIONS = ["none", "paraphrase_only", "quote_safe"]
const SAFETY_INTENSITIES = ["normal", "gentle", "sensitive", "blocked"]
const ALLOWED_USES = ["internal_retrieval", "paraphrase_generation", "direct_quote_display", "curriculum_display"]

const SOURCE_STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  source_saved: { tone: "success", message: "Source document state saved." },
  source_invalid: { tone: "error", message: "Source document update needs a valid state and reason." },
  source_missing: { tone: "error", message: "That source document is no longer available." },
  source_rights_missing: { tone: "error", message: "Add a current paraphrase-compatible rights grant before approving this source." },
  curriculum_saved: { tone: "success", message: "Curriculum publish state saved." },
  curriculum_invalid: { tone: "error", message: "Curriculum update needs a valid state and reason." },
  chunk_saved: { tone: "success", message: "Source chunk state saved." },
  chunk_invalid: { tone: "error", message: "Chunk update needs valid review, quote, safety, and reason fields." },
  chunk_missing: { tone: "error", message: "That source chunk is no longer available." },
  chunk_not_eligible: { tone: "error", message: "Chunk cannot be approved until its document state, rights, and safety policy allow retrieval." },
  chunk_quote_blocked: { tone: "error", message: "Quote-safe display requires approved direct-quote rights with quote permission." },
  rights_saved: { tone: "success", message: "Source rights grant saved." },
  rights_invalid: { tone: "error", message: "Rights grant needs an owner, allowed use, status, and reason." },
}

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? SOURCE_STATUS_MESSAGES[status] : null
  const [documents, curriculumDays, chunks, reviewChunks, batches] = await Promise.all([
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
        rightsGrants: {
          orderBy: { createdAt: "desc" },
          take: 2,
          select: { id: true, ownerName: true, status: true, allowedUses: true, quoteAllowed: true, reason: true },
        },
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
    prisma.sourceChunk.findMany({
      orderBy: [{ reviewState: "asc" }, { createdAt: "desc" }],
      take: 25,
      select: {
        id: true,
        chunkText: true,
        quoteSafeExcerpt: true,
        reviewState: true,
        quotePermission: true,
        safetyIntensity: true,
        conceptTags: true,
        councilRoleTags: true,
        sourceDocument: { select: { title: true, rightsStatus: true, reviewState: true } },
      },
    }),
    prisma.sourceImportBatch.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, sourceRoot: true, status: true, importedCount: true, skippedCount: true, failedCount: true, createdAt: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metadata-first review for Maria source material, curriculum, and retrieval chunks.
        </p>
      </div>

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
        <CardHeader><CardTitle>Import Batches</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {batches.length === 0 ? (
            <p className="text-sm text-muted-foreground">No import batches recorded yet.</p>
          ) : batches.map((batch) => (
            <div key={batch.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{batch.status}</p>
                <p className="text-xs text-muted-foreground">{formatAdminDateTime(batch.createdAt)}</p>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {batch.importedCount} imported · {batch.skippedCount} skipped · {batch.failedCount} failed
              </p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{batch.sourceRoot}</p>
            </div>
          ))}
        </CardContent>
      </Card>

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
                <input name="reason" placeholder="Reason required" required minLength={10} className="min-w-48 rounded-md border bg-background px-2 py-1 text-xs" />
                <button type="submit" className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                  Update
                </button>
              </form>
              <div className="mt-3 rounded-md bg-muted/40 p-3">
                <p className="text-xs font-medium">Rights grants</p>
                {document.rightsGrants.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">No structured rights grant yet.</p>
                ) : document.rightsGrants.map((grant) => (
                  <p key={grant.id} className="mt-1 text-xs text-muted-foreground">
                    {grant.ownerName} · {grant.status} · quote {grant.quoteAllowed ? "allowed" : "not allowed"}
                  </p>
                ))}
                <form action={upsertSourceRightsGrantAction} className="mt-3 grid gap-2 md:grid-cols-2">
                  <input type="hidden" name="sourceDocumentId" value={document.id} />
                  <input name="ownerName" defaultValue="Maria Olon Tsaroucha" required minLength={2} className="rounded-md border bg-background px-2 py-1 text-xs" />
                  <select name="status" defaultValue="needs_review" className="rounded-md border bg-background px-2 py-1 text-xs">
                    {["needs_review", "approved", "paraphrase_only", "revoked", "expired", "blocked"].map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                  <div className="flex flex-wrap gap-2 md:col-span-2">
                    {ALLOWED_USES.map((use) => (
                      <label key={use} className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input type="checkbox" name="allowedUses" value={use} />
                        {use}
                      </label>
                    ))}
                  </div>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" name="quoteAllowed" />
                    quote allowed
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" name="attributionRequired" />
                    attribution required
                  </label>
                  <input name="reason" placeholder="Rights reason required" required minLength={10} className="rounded-md border bg-background px-2 py-1 text-xs md:col-span-2" />
                  <button type="submit" className="w-fit rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                    Add rights grant
                  </button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Chunk Review</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {reviewChunks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source chunks parsed yet.</p>
          ) : reviewChunks.map((chunk) => (
            <div key={chunk.id} className="rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{chunk.sourceDocument.title}</p>
                <p className="text-xs text-muted-foreground">
                  doc {chunk.sourceDocument.reviewState}/{chunk.sourceDocument.rightsStatus} · chunk {chunk.reviewState}
                </p>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {chunk.chunkText.slice(0, 420)}{chunk.chunkText.length > 420 ? "..." : ""}
              </p>
              {chunk.quoteSafeExcerpt && (
                <p className="mt-2 text-xs italic text-muted-foreground">Quote-safe: {chunk.quoteSafeExcerpt}</p>
              )}
              <form action={updateSourceChunkStateAction} className="mt-3 grid gap-2 md:grid-cols-4">
                <input type="hidden" name="sourceChunkId" value={chunk.id} />
                <select name="reviewState" defaultValue={chunk.reviewState} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {CHUNK_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
                <select name="quotePermission" defaultValue={chunk.quotePermission} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {QUOTE_PERMISSIONS.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
                <select name="safetyIntensity" defaultValue={chunk.safetyIntensity} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {SAFETY_INTENSITIES.map((state) => <option key={state} value={state}>{state}</option>)}
                </select>
                <input name="conceptTags" placeholder="concept tags" defaultValue={arrayText(chunk.conceptTags)} className="rounded-md border bg-background px-2 py-1 text-xs" />
                <input name="councilRoleTags" placeholder="role tags" defaultValue={arrayText(chunk.councilRoleTags)} className="rounded-md border bg-background px-2 py-1 text-xs md:col-span-2" />
                <input name="reason" placeholder="Reason required" required minLength={10} className="rounded-md border bg-background px-2 py-1 text-xs md:col-span-2" />
                <button type="submit" className="w-fit rounded-md border px-3 py-1 text-xs font-medium hover:bg-muted">
                  Save chunk
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
                <input name="reason" placeholder="Reason required" required minLength={10} className="min-w-48 rounded-md border bg-background px-2 py-1 text-xs" />
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

function arrayText(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").join(", ") : ""
}
