import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { activateRagAction, getRagReadinessCounts } from "./actions"

export default async function RagReadinessPage() {
  const [flag, readiness, recentTraces] = await Promise.all([
    prisma.featureFlag.findUnique({
      where: { key: "rag_enabled" },
      select: { enabled: true, metadata: true, updatedAt: true },
    }),
    getRagReadinessCounts(),
    prisma.generationTrace.findMany({
      where: { traceType: "retrieval" },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        validationStatus: true,
        fallbackReason: true,
        outputJson: true,
        createdAt: true,
      },
    }),
  ])
  const latestEval = readEvalReport(flag?.metadata)
  const blockers = [
    readiness.approvedDocuments === 0 ? "No approved product doctrine documents." : null,
    readiness.eligibleChunks === 0 ? "No eligible product doctrine chunks." : null,
    readiness.rightsMissingApprovedChunks > 0 ? `${readiness.rightsMissingApprovedChunks} approved chunks are missing rights coverage.` : null,
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      <div>
        <Link href="/sources" className="text-sm text-muted-foreground hover:text-foreground">
          Back to sources
        </Link>
        <h1 className="mt-3 text-2xl font-semibold">RAG Readiness</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Activation is super-admin gated and uses approved, rights-compatible product doctrine only.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="RAG enabled" value={flag?.enabled ? "Yes" : "No"} />
        <Metric title="Approved docs" value={readiness.approvedDocuments} />
        <Metric title="Eligible chunks" value={readiness.eligibleChunks} />
        <Metric title="No-source fallbacks" value={readiness.noEligibleSourceTraces} />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Quote-safe chunks" value={readiness.quoteSafeChunks} />
        <Metric title="Blocked/sensitive" value={readiness.blockedOrSensitiveChunks} />
        <Metric title="Failed imports" value={readiness.failedImports} />
        <Metric title="Rights blockers" value={readiness.rightsMissingApprovedChunks} />
      </div>

      <Card>
        <CardHeader><CardTitle>Activation Gate</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {blockers.length > 0 ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {blockers.map((blocker) => <p key={blocker}>{blocker}</p>)}
            </div>
          ) : (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              Core counts are ready. Activation still requires a current eval report and super-admin reason.
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Latest activation eval: {latestEval ?? "No activation eval recorded."}
          </p>
          <form action={activateRagAction} className="grid gap-3 md:grid-cols-2">
            <input
              name="evalReport"
              placeholder="Eval report id or summary"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <input
              name="reason"
              placeholder="Super-admin activation reason"
              className="rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button type="submit" className="w-fit rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
              Activate RAG
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Recent Retrieval Traces</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {recentTraces.length === 0 ? (
            <p className="text-sm text-muted-foreground">No retrieval traces recorded yet.</p>
          ) : recentTraces.map((trace) => {
            const output = trace.outputJson as { title?: string; rank?: number; matchReason?: string; sourcePolicyVersion?: string } | null
            return (
              <div key={trace.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{trace.validationStatus}</p>
                  <p className="text-xs text-muted-foreground">{new Date(trace.createdAt).toLocaleString()}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {output?.title ?? trace.fallbackReason ?? "Retrieval trace"}
                </p>
                {output?.matchReason && (
                  <p className="mt-1 text-xs text-muted-foreground">{output.matchReason}</p>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}

function readEvalReport(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("evalReport" in metadata)) return null
  const value = (metadata as { evalReport?: unknown }).evalReport
  return typeof value === "string" ? value : null
}
