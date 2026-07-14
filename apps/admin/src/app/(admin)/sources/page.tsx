import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { REASONING_SCOPES, isSupportedSourceTextFile } from "@inner-avatar/ai"
import { AdminStatusBanner, InlineActionHelp } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
import { formatAdminDateTime } from "@/lib/date-format"
import { getSourceReadinessStatus } from "@/lib/source-readiness"
import {
  approveParsedSourceChunksAction,
  approveSourceForInternalRagAction,
  parseSourceDocumentAction,
  saveSourceRightsGrantAction,
  updateCurriculumDayStateAction,
  updateSourceChunkStateAction,
  updateSourceDocumentStateAction,
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
  source_parsed: { tone: "success", message: "Source document parsed into reviewable chunks." },
  source_parse_invalid: { tone: "error", message: "Source parsing needs a source and audit reason." },
  source_parse_unsupported: { tone: "error", message: "Only registered DOCX or PDF source documents can be parsed here." },
  source_parse_exists: { tone: "error", message: "This source already has sections or chunks." },
  source_parse_empty: { tone: "error", message: "No text was found in that source document." },
  source_parse_failed: { tone: "error", message: "Source document parsing failed. Confirm the file is available and readable." },
  source_rag_approved: { tone: "success", message: "Source approved for internal RAG with paraphrase-only rights." },
  source_rag_invalid: { tone: "error", message: "Approving for RAG needs a source and audit reason." },
  source_chunks_approved: { tone: "success", message: "Parsed chunks approved for paraphrase retrieval." },
  source_chunks_invalid: { tone: "error", message: "Chunk approval needs a source and audit reason." },
  source_chunks_source_not_ready: { tone: "error", message: "Approve the source document and paraphrase rights before approving chunks." },
  curriculum_saved: { tone: "success", message: "Curriculum publish state saved." },
  curriculum_invalid: { tone: "error", message: "Curriculum update needs a valid state and reason." },
  chunk_saved: { tone: "success", message: "Source chunk state saved." },
  chunk_invalid: { tone: "error", message: "Chunk update needs valid review, quote, safety, and reason fields." },
  chunk_missing: { tone: "error", message: "That source chunk is no longer available." },
  chunk_not_eligible: { tone: "error", message: "Chunk cannot be approved until its document state, rights, and safety policy allow retrieval." },
  chunk_quote_blocked: { tone: "error", message: "Quote-safe display requires approved direct-quote rights with quote permission." },
  rights_saved: { tone: "success", message: "Source rights grant saved." },
  rights_invalid: { tone: "error", message: "Rights grant needs an owner, allowed use, status, and reason." },
  rights_missing: { tone: "error", message: "That rights grant is no longer available for this source." },
  rights_duplicate: { tone: "error", message: "This source already has a current rights grant. Edit the current grant or use Create new rights grant intentionally." },
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
        author: true,
        work: true,
        sourceType: true,
        reasoningScope: true,
        rightsStatus: true,
        reviewState: true,
        language: true,
        filePath: true,
        metadata: true,
        updatedAt: true,
        importBatch: { select: { parserVersion: true } },
        rightsGrants: {
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            ownerName: true,
            grantType: true,
            status: true,
            allowedUses: true,
            quoteAllowed: true,
            attributionRequired: true,
            attributionText: true,
            reason: true,
            reviewedAt: true,
            expiresAt: true,
            revokedAt: true,
          },
        },
        chunks: { select: { id: true, reviewState: true, quotePermission: true, safetyIntensity: true } },
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
          ) : documents.map((document) => {
            const currentGrant = currentRightsGrant(document.rightsGrants)
            const readiness = getSourceReadinessStatus(document)
            return (
            <div id={`source-${document.id}`} key={document.id} className="scroll-mt-6 rounded-md border p-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">{document.title}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={readinessBadgeClass(readiness)}>{readinessLabel(readiness)}</span>
                  <p className="text-xs text-muted-foreground">
                    {document.sourceType} · {reasoningScopeLabel(document.reasoningScope)} · {document.reviewState} · {document.rightsStatus}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {document._count.sections} sections · {document._count.chunks} chunks · {document._count.curriculumDays} curriculum days
              </p>
              <div className="mt-3 grid gap-2 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground md:grid-cols-2">
                <p>
                  <span className="font-medium text-foreground">Author:</span> {document.author || "Unknown"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Work:</span> {document.work || "Not specified"}
                </p>
                <p>
                  <span className="font-medium text-foreground">Language:</span> {document.language}
                </p>
                <p>
                  <span className="font-medium text-foreground">Parser:</span> {document.importBatch?.parserVersion || "Registered only"}
                </p>
                <p className="break-all md:col-span-2">
                  <span className="font-medium text-foreground">File:</span> {sourcePathLabel(document)}
                </p>
              </div>
              {canParseDocument(document) ? (
                <form action={parseSourceDocumentAction} className="mt-3 rounded-md border border-amber-500/30 bg-amber-500/5 p-3">
                  <input type="hidden" name="sourceDocumentId" value={document.id} />
                  <p className="text-xs font-medium text-amber-900 dark:text-amber-200">No reviewable chunks yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Parse this source file into reviewable chunks first. This creates reviewable material only; it does not approve rights, retrieval, quotes, or curriculum display.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      name="reason"
                      placeholder="Parsing reason required"
                      required
                      minLength={10}
                      className="min-w-64 rounded-md border bg-background px-2 py-1 text-xs"
                    />
                    <SubmitButton pendingLabel="Parsing...">Parse into chunks</SubmitButton>
                  </div>
                </form>
              ) : null}
              <div className="mt-3 grid gap-3 rounded-md border bg-background p-3 md:grid-cols-2">
                <form action={approveSourceForInternalRagAction} className="space-y-2">
                  <input type="hidden" name="sourceDocumentId" value={document.id} />
                  <p className="text-xs font-medium">Guided approval</p>
                  <p className="text-xs text-muted-foreground">
                    Approves this source for internal retrieval and paraphrase generation only. Direct quotes and curriculum display remain off.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input name="reason" placeholder="Approval reason required" required minLength={10} className="min-w-56 rounded-md border bg-background px-2 py-1 text-xs" />
                    <SubmitButton pendingLabel="Approving...">Approve for internal RAG</SubmitButton>
                  </div>
                </form>
                <form action={approveParsedSourceChunksAction} className="space-y-2">
                  <input type="hidden" name="sourceDocumentId" value={document.id} />
                  <p className="text-xs font-medium">Chunk approval</p>
                  <p className="text-xs text-muted-foreground">
                    Approves parsed chunks on this source for paraphrase retrieval after source rights are ready.
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <input name="reason" placeholder="Chunk approval reason required" required minLength={10} className="min-w-56 rounded-md border bg-background px-2 py-1 text-xs" />
                    <SubmitButton pendingLabel="Approving chunks...">Approve parsed chunks</SubmitButton>
                  </div>
                </form>
              </div>
              <form action={updateSourceDocumentStateAction} className="mt-3 grid gap-2 rounded-md border bg-muted/20 p-3 md:grid-cols-4">
                <input type="hidden" name="sourceDocumentId" value={document.id} />
                <label className="grid gap-1 text-xs font-medium">
                  Source document state
                  <select name="reviewState" defaultValue={document.reviewState} className="rounded-md border bg-background px-2 py-1 text-xs">
                    {SOURCE_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Source rights status
                  <select name="rightsStatus" defaultValue={document.rightsStatus} className="rounded-md border bg-background px-2 py-1 text-xs">
                    {RIGHTS_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Reasoning scope
                  <select name="reasoningScope" defaultValue={document.reasoningScope} className="rounded-md border bg-background px-2 py-1 text-xs">
                    {REASONING_SCOPES.map((scope) => (
                      <option key={scope} value={scope}>{reasoningScopeLabel(scope)}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-xs font-medium">
                  Audit reason
                  <input name="reason" placeholder="Reason required" required minLength={10} className="rounded-md border bg-background px-2 py-1 text-xs" />
                </label>
                <div className="flex items-end">
                  <SubmitButton pendingLabel="Updating...">Update source state</SubmitButton>
                </div>
              </form>
              <div className="mt-3 rounded-md bg-muted/40 p-3">
                <p className="text-xs font-medium">Rights grant</p>
                {statusCode && statusCode.startsWith("rights_") ? (
                  <p className={[
                    "mt-2 rounded-md border px-3 py-2 text-xs",
                    statusMessage?.tone === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700" : "",
                    statusMessage?.tone === "error" ? "border-destructive/20 bg-destructive/5 text-destructive" : "",
                  ].filter(Boolean).join(" ")}>
                    {statusMessage?.message}
                  </p>
                ) : null}
                {currentGrant ? (
                  <RightsGrantForm
                    documentId={document.id}
                    grant={currentGrant}
                    submitLabel="Save current grant"
                    createNew={false}
                  />
                ) : (
                  <p className="mt-1 text-xs text-muted-foreground">No current rights grant yet. Create one below or use Approve for internal RAG.</p>
                )}
                {document.rightsGrants.length > 0 ? (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs font-medium">Grant history</p>
                    {document.rightsGrants.map((grant) => (
                      <div key={grant.id} className="rounded-md border bg-background/60 p-2 text-xs text-muted-foreground">
                        <p className="font-medium text-foreground">{grant.ownerName} · {grant.status}</p>
                        <p className="mt-1">
                          uses: {arrayText(grant.allowedUses) || "none"} · quote {grant.quoteAllowed ? "allowed" : "not allowed"} · attribution {grant.attributionRequired ? "required" : "not required"}
                        </p>
                        <p className="mt-1">reviewed {grant.reviewedAt ? formatAdminDateTime(grant.reviewedAt) : "not reviewed"}</p>
                        {grant.reason ? <p className="mt-1">reason: {grant.reason.slice(0, 140)}{grant.reason.length > 140 ? "..." : ""}</p> : null}
                      </div>
                    ))}
                  </div>
                ) : null}
                <details className="mt-3 rounded-md border bg-background/70 p-3">
                  <summary className="cursor-pointer text-xs font-medium">Create new rights grant</summary>
                  {currentGrant ? (
                    <InlineActionHelp>
                      A current grant already exists. Create a new grant only when you intentionally need a separate rights-history record.
                    </InlineActionHelp>
                  ) : null}
                  <RightsGrantForm
                    documentId={document.id}
                    grant={null}
                    submitLabel="Create new grant"
                    createNew
                  />
                </details>
              </div>
            </div>
          )
          })}
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

function RightsGrantForm({
  documentId,
  grant,
  submitLabel,
  createNew,
}: {
  documentId: string
  grant: {
    id: string
    ownerName: string
    grantType: string
    status: string
    allowedUses: unknown
    quoteAllowed: boolean
    attributionRequired: boolean
    attributionText: string | null
  } | null
  submitLabel: string
  createNew: boolean
}) {
  const allowedUses = parseStringArray(grant?.allowedUses)

  return (
    <form action={saveSourceRightsGrantAction} className="mt-3 grid gap-2 md:grid-cols-2">
      <input type="hidden" name="sourceDocumentId" value={documentId} />
      {grant ? <input type="hidden" name="sourceRightsGrantId" value={grant.id} /> : null}
      {createNew ? <input type="hidden" name="createNewGrant" value="true" /> : null}
      <label className="grid gap-1 text-xs font-medium">
        Owner
        <input name="ownerName" defaultValue={grant?.ownerName ?? "Maria Olon Tsaroucha"} required minLength={2} className="rounded-md border bg-background px-2 py-1 text-xs" />
      </label>
      <label className="grid gap-1 text-xs font-medium">
        Grant status
        <select name="status" defaultValue={grant?.status ?? "needs_review"} className="rounded-md border bg-background px-2 py-1 text-xs">
          {["needs_review", "approved", "paraphrase_only", "revoked", "expired", "blocked"].map((state) => (
            <option key={state} value={state}>{state}</option>
          ))}
        </select>
      </label>
      <input type="hidden" name="grantType" value={grant?.grantType ?? "provided_by_owner"} />
      <div className="flex flex-wrap gap-2 md:col-span-2">
        {ALLOWED_USES.map((use) => (
          <label key={use} className="flex items-center gap-1 text-xs text-muted-foreground">
            <input
              type="checkbox"
              name="allowedUses"
              value={use}
              defaultChecked={grant ? allowedUses.includes(use) : use === "paraphrase_generation"}
            />
            {use}
          </label>
        ))}
      </div>
      <InlineActionHelp>
        For normal Maria manuscript RAG, use `internal_retrieval` and `paraphrase_generation`. Keep direct quotes and curriculum display off unless explicitly approved.
      </InlineActionHelp>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input type="checkbox" name="quoteAllowed" defaultChecked={grant?.quoteAllowed ?? false} />
        quote allowed
      </label>
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <input type="checkbox" name="attributionRequired" defaultChecked={grant?.attributionRequired ?? false} />
        attribution required
      </label>
      <input name="attributionText" placeholder="Attribution text, if required" defaultValue={grant?.attributionText ?? ""} className="rounded-md border bg-background px-2 py-1 text-xs md:col-span-2" />
      <input name="reason" placeholder="Rights reason required" required minLength={10} className="rounded-md border bg-background px-2 py-1 text-xs md:col-span-2" />
      <SubmitButton pendingLabel="Saving grant...">{submitLabel}</SubmitButton>
    </form>
  )
}

function arrayText(value: unknown) {
  return parseStringArray(value).join(", ")
}

function parseStringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

function currentRightsGrant<T extends { status: string }>(grants: T[]) {
  return grants.find((grant) => !["revoked", "expired", "blocked"].includes(grant.status)) ?? null
}

function readinessLabel(status: ReturnType<typeof getSourceReadinessStatus>) {
  if (status === "not_parsed") return "Not parsed"
  if (status === "rights_pending") return "Rights pending"
  if (status === "document_blocked") return "Document blocked"
  if (status === "chunks_pending") return "Chunks pending"
  return "Ready for RAG"
}

function readinessBadgeClass(status: ReturnType<typeof getSourceReadinessStatus>) {
  const base = "rounded-full border px-2 py-0.5 text-xs font-medium"
  if (status === "ready_for_rag") return `${base} border-emerald-500/30 bg-emerald-500/10 text-emerald-700`
  if (status === "chunks_pending") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-700`
  if (status === "rights_pending") return `${base} border-amber-500/30 bg-amber-500/10 text-amber-700`
  return `${base} border-destructive/25 bg-destructive/10 text-destructive`
}

function canParseDocument(document: { filePath: string | null; _count: { chunks: number; sections: number } }) {
  return isSupportedSourceTextFile(document.filePath) &&
    document._count.chunks === 0 &&
    document._count.sections === 0
}

function sourcePathLabel(document: { filePath: string | null; metadata: unknown }) {
  return readMetadataString(document.metadata, "relativePath") ?? document.filePath ?? "No file path recorded"
}

function readMetadataString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === "string" && value ? value : null
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
