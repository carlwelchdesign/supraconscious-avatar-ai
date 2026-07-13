import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { REASONING_SCOPES } from "@inner-avatar/ai"
import { AdminStatusBanner, InlineActionHelp } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
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
const CURRICULUM_LIMITS = ["40", "100", "all"] as const
const CURRICULUM_FILTER_STATES = ["all", ...CURRICULUM_STATES] as const

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
  searchParams: Promise<{ status?: string; actionStatus?: string; month?: string; publishState?: string; limit?: string }>
}) {
  const { status, actionStatus, month, publishState, limit } = await searchParams
  const statusCode = actionStatus ?? status
  const statusMessage = statusCode ? SOURCE_STATUS_MESSAGES[statusCode] : null

  const currentMonth = getCurrentAppMonth()
  const requestedMonth = parseMonthParam(month)
  const hasCurrentMonth = await prisma.curriculumDay.count({ where: { month: currentMonth } })
  const selectedMonth = requestedMonth === "all"
    ? "all"
    : requestedMonth ?? (hasCurrentMonth > 0 ? currentMonth : "all")
  const baseCurriculumWhere = selectedMonth === "all" ? {} : { month: selectedMonth }
  const requestedPublishState = parsePublishStateParam(publishState)
  const needsReviewInScope = await prisma.curriculumDay.count({
    where: { ...baseCurriculumWhere, publishState: "needs_review" },
  })
  const selectedPublishState = requestedPublishState ?? (needsReviewInScope > 0 ? "needs_review" : "all")
  const selectedLimit = parseLimitParam(limit)
  const curriculumWhere = {
    ...baseCurriculumWhere,
    ...(selectedPublishState === "all" ? {} : { publishState: selectedPublishState }),
  }
  const curriculumTake = selectedLimit === "all" ? undefined : Number(selectedLimit)

  const [documents, curriculumDays, totalCurriculumDays, matchingCurriculumDays, chunks, reviewChunks, batches] = await Promise.all([
    prisma.sourceDocument.findMany({
      orderBy: { updatedAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        sourceType: true,
        reasoningScope: true,
        rightsStatus: true,
        reviewState: true,
        updatedAt: true,
        rightsGrants: {
          orderBy: { createdAt: "desc" },
          take: 2,
          select: { id: true, ownerName: true, status: true, allowedUses: true, quoteAllowed: true, attributionRequired: true, reason: true, reviewedAt: true },
        },
        _count: { select: { chunks: true, sections: true, curriculumDays: true } },
      },
    }),
    prisma.curriculumDay.findMany({
      where: curriculumWhere,
      orderBy: [{ month: "asc" }, { day: "asc" }],
      take: curriculumTake,
      select: {
        id: true,
        month: true,
        day: true,
        theme: true,
        publishState: true,
        socraticQuestion: true,
      },
    }),
    prisma.curriculumDay.count(),
    prisma.curriculumDay.count({ where: curriculumWhere }),
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
  const curriculumFilters = {
    month: String(selectedMonth),
    publishState: selectedPublishState,
    limit: selectedLimit,
  }
  const cappedCurriculum = selectedLimit !== "all" && curriculumDays.length < matchingCurriculumDays

  return (
    <div className="space-y-6">
      <div id="overview" className="scroll-mt-6">
        <h1 className="text-2xl font-semibold">Sources</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Metadata-first review for Maria source material, curriculum, and retrieval chunks.
        </p>
      </div>

      <AdminStatusBanner message={statusMessage} />

      <nav className="sticky top-0 z-10 -mx-1 overflow-x-auto border-y bg-background/95 px-1 py-2 backdrop-blur">
        <div className="flex min-w-max gap-2">
          {[
            ["Overview", "#overview"],
            ["Import Batches", "#import-batches"],
            ["Source Documents", "#source-documents"],
            ["Chunk Review", "#chunk-review"],
            ["Curriculum Preview", "#curriculum-preview"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              className="rounded-md border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:text-foreground"
            >
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{documents.length}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Curriculum Days</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-semibold">{totalCurriculumDays}</p>
            <p className="mt-1 text-xs text-muted-foreground">{curriculumDays.length} shown in preview</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Approved Chunks</CardTitle></CardHeader>
          <CardContent className="text-3xl font-semibold">{chunks}</CardContent>
        </Card>
      </div>

      <Card id="import-batches" className="scroll-mt-16">
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

      <Card id="source-documents" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Source Documents</CardTitle>
          <p className="text-sm text-muted-foreground">
            Document review controls whether a source is allowed at all. Rights grants record permitted uses. Actual content review happens at the chunk level after parsing.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source documents imported yet.</p>
          ) : documents.map((document) => (
            <div id={`source-${document.id}`} key={document.id} className="scroll-mt-6 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{document.title}</p>
                <p className="text-xs text-muted-foreground">
                  {document.sourceType} · {reasoningScopeLabel(document.reasoningScope)} · {document.reviewState} · {document.rightsStatus}
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
                <select name="reasoningScope" defaultValue={document.reasoningScope} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {REASONING_SCOPES.map((scope) => (
                    <option key={scope} value={scope}>{reasoningScopeLabel(scope)}</option>
                  ))}
                </select>
                <input name="reason" placeholder="Reason required" required minLength={10} className="min-w-48 rounded-md border bg-background px-2 py-1 text-xs" />
                <SubmitButton pendingLabel="Updating...">Update</SubmitButton>
              </form>
              <div className="mt-3 rounded-md bg-muted/40 p-3">
                <p className="text-xs font-medium">Rights grants</p>
                {statusCode && statusCode.startsWith("rights_") ? (
                  <p className={[
                    "mt-2 rounded-md border px-3 py-2 text-xs",
                    statusMessage?.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "",
                    statusMessage?.tone === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "",
                  ].filter(Boolean).join(" ")}>
                    {statusMessage?.message}
                  </p>
                ) : null}
                {document.rightsGrants.length === 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">No structured rights grant yet.</p>
                ) : document.rightsGrants.map((grant) => (
                  <div key={grant.id} className="mt-2 rounded-md border bg-background/60 p-2 text-xs text-muted-foreground">
                    <p className="font-medium text-foreground">{grant.ownerName} · {grant.status}</p>
                    <p className="mt-1">
                      uses: {arrayText(grant.allowedUses) || "none"} · quote {grant.quoteAllowed ? "allowed" : "not allowed"} · attribution {grant.attributionRequired ? "required" : "not required"}
                    </p>
                    <p className="mt-1">reviewed {grant.reviewedAt ? formatAdminDateTime(grant.reviewedAt) : "not reviewed"}</p>
                    {grant.reason ? <p className="mt-1">reason: {grant.reason.slice(0, 140)}{grant.reason.length > 140 ? "..." : ""}</p> : null}
                  </div>
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
                        <input type="checkbox" name="allowedUses" value={use} defaultChecked={use === "paraphrase_generation"} />
                        {use}
                      </label>
                    ))}
                  </div>
                  <InlineActionHelp>
                    Rights grants require at least one allowed use. `paraphrase_generation` is selected by default because it is required before source material can support RAG reflections.
                  </InlineActionHelp>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" name="quoteAllowed" />
                    quote allowed
                  </label>
                  <label className="flex items-center gap-1 text-xs text-muted-foreground">
                    <input type="checkbox" name="attributionRequired" />
                    attribution required
                  </label>
                  <input name="reason" placeholder="Rights reason required" required minLength={10} className="rounded-md border bg-background px-2 py-1 text-xs md:col-span-2" />
                  <SubmitButton pendingLabel="Adding grant...">Add rights grant</SubmitButton>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card id="chunk-review" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Chunk Review</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review parsed source text here before it can support retrieval. Documents with zero chunks have no reviewable content yet.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviewChunks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No source chunks parsed yet.</p>
          ) : reviewChunks.map((chunk) => (
            <div id={`chunk-${chunk.id}`} key={chunk.id} className="scroll-mt-6 rounded-md border p-3 text-sm">
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
                <SubmitButton pendingLabel="Saving chunk...">Save chunk</SubmitButton>
              </form>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card id="curriculum-preview" className="scroll-mt-16">
        <CardHeader>
          <CardTitle>Curriculum Preview</CardTitle>
          <p className="text-sm text-muted-foreground">
            Review daily curriculum prompts separately from RAG chunks. This view is filtered, so the count below shows exactly what is displayed.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <form action="/sources#curriculum-preview" className="grid gap-2 rounded-md border bg-muted/30 p-3 md:grid-cols-4">
            <label className="grid gap-1 text-xs font-medium">
              Month
              <select name="month" defaultValue={curriculumFilters.month} className="rounded-md border bg-background px-2 py-1 text-xs">
                <option value="all">All months</option>
                {Array.from({ length: 12 }, (_, index) => index + 1).map((monthNumber) => (
                  <option key={monthNumber} value={monthNumber}>Month {monthNumber}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              State
              <select name="publishState" defaultValue={curriculumFilters.publishState} className="rounded-md border bg-background px-2 py-1 text-xs">
                {CURRICULUM_FILTER_STATES.map((state) => (
                  <option key={state} value={state}>{state === "all" ? "All states" : state}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Limit
              <select name="limit" defaultValue={curriculumFilters.limit} className="rounded-md border bg-background px-2 py-1 text-xs">
                {CURRICULUM_LIMITS.map((limitOption) => (
                  <option key={limitOption} value={limitOption}>{limitOption === "all" ? "All matching" : limitOption}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <SubmitButton pendingLabel="Applying...">Apply filters</SubmitButton>
            </div>
          </form>
          <div className="rounded-md border bg-background p-3 text-sm">
            <p className="font-medium">
              Showing {curriculumDays.length} of {matchingCurriculumDays} matching curriculum days.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {totalCurriculumDays} curriculum days are imported across the full source set.
              {cappedCurriculum ? " Increase the limit or filter by month to review more." : ""}
            </p>
          </div>
          {curriculumDays.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No curriculum days match month {curriculumFilters.month === "all" ? "all" : curriculumFilters.month} and state {curriculumFilters.publishState}.
            </p>
          ) : curriculumDays.map((day) => (
            <div key={day.id} className="rounded-md border p-3 text-sm">
              <p className="font-medium">Month {day.month}, Day {day.day}: {day.theme}</p>
              <p className="mt-1 text-xs text-muted-foreground">{day.publishState}</p>
              <p className="mt-2 text-sm">{day.socraticQuestion}</p>
              <form action={updateCurriculumDayStateAction} className="mt-3 flex flex-wrap items-center gap-2">
                <input type="hidden" name="curriculumDayId" value={day.id} />
                <input type="hidden" name="month" value={curriculumFilters.month} />
                <input type="hidden" name="publishStateFilter" value={curriculumFilters.publishState} />
                <input type="hidden" name="limit" value={curriculumFilters.limit} />
                <select name="publishState" defaultValue={day.publishState} className="rounded-md border bg-background px-2 py-1 text-xs">
                  {CURRICULUM_STATES.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
                <input name="reason" placeholder="Reason required" required minLength={10} className="min-w-48 rounded-md border bg-background px-2 py-1 text-xs" />
                <SubmitButton pendingLabel="Saving state...">Save state</SubmitButton>
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

function reasoningScopeLabel(scope: string) {
  if (scope === "maria_materials") return "Maria materials"
  if (scope === "product_doctrine") return "Product doctrine"
  if (scope === "curriculum") return "Curriculum"
  if (scope === "reference_only") return "Reference only"
  if (scope === "excluded") return "Excluded"
  return scope
}

function parseMonthParam(value: string | undefined) {
  if (!value || value === "all") return value === "all" ? "all" : null
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 12 ? parsed : null
}

function parsePublishStateParam(value: string | undefined) {
  return CURRICULUM_FILTER_STATES.includes(value as (typeof CURRICULUM_FILTER_STATES)[number])
    ? value as (typeof CURRICULUM_FILTER_STATES)[number]
    : null
}

function parseLimitParam(value: string | undefined) {
  return CURRICULUM_LIMITS.includes(value as (typeof CURRICULUM_LIMITS)[number])
    ? value as (typeof CURRICULUM_LIMITS)[number]
    : "40"
}

function getCurrentAppMonth() {
  const timeZone = process.env.APP_TIME_ZONE || "America/Los_Angeles"
  const formatted = new Intl.DateTimeFormat("en-US", { month: "numeric", timeZone }).format(new Date())
  const month = Number(formatted)
  return Number.isInteger(month) && month >= 1 && month <= 12 ? month : new Date().getMonth() + 1
}
