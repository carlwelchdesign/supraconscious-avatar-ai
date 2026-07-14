import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { REASONING_SCOPES } from "@inner-avatar/ai"
import { AdminStatusBanner } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
import { formatAdminDateTime } from "@/lib/date-format"
import { generateReasoningGraphAction, reviewReasoningGraphItemAction } from "./actions"
import { ReasoningGraphView, type ReasoningGraphViewData } from "./reasoning-graph-view"

const STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  generated: { tone: "success", message: "Reasoning graph generated from approved source material." },
  invalid: { tone: "error", message: "Graph generation needs a valid source scope, chunk limit, and reason." },
  no_sources: { tone: "error", message: "No approved, rights-compatible source chunks are available for that reasoning scope. Parse and approve source chunks for the selected scope, or choose a diagnostic scope intentionally." },
  failed: { tone: "error", message: "Reasoning graph generation failed. The previous completed graph was preserved." },
  review_saved: { tone: "success", message: "Reasoning graph review state saved." },
  review_invalid: { tone: "error", message: "Review update needs a valid target, state, and reason." },
}

export default async function ReasoningGraphPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? STATUS_MESSAGES[status] : null
  const [latestRun, failedRun, sourceScopes] = await Promise.all([
    prisma.reasoningGraphRun.findFirst({
      where: { status: "completed", NOT: { sourceScope: "approved_sources" } },
      orderBy: { createdAt: "desc" },
      include: {
        clusters: { orderBy: [{ size: "desc" }, { clusterKey: "asc" }] },
        nodes: {
          orderBy: [{ bridgeScore: "desc" }, { weightedDegree: "desc" }],
          include: {
            cluster: { select: { clusterKey: true } },
            evidence: {
              take: 5,
              include: { sourceDocument: { select: { title: true } } },
            },
          },
        },
        edges: {
          orderBy: [{ weight: "desc" }, { confidence: "desc" }],
          include: { fromNode: { select: { label: true } }, toNode: { select: { label: true } } },
        },
        insights: {
          orderBy: [{ insightType: "asc" }, { confidence: "desc" }],
          include: {
            evidence: {
              take: 4,
              include: { sourceDocument: { select: { title: true } } },
            },
          },
        },
      },
    }),
    prisma.reasoningGraphRun.findFirst({
      where: { status: "failed", NOT: { sourceScope: "approved_sources" } },
      orderBy: { createdAt: "desc" },
      select: { errorMessage: true, createdAt: true },
    }),
    prisma.sourceDocument.groupBy({
      by: ["reasoningScope"],
      where: { reviewState: { in: ["approved", "approved_curriculum"] }, rightsStatus: { in: ["approved", "paraphrase_only"] } },
      _count: { _all: true },
      orderBy: { reasoningScope: "asc" },
    }),
  ])
  const graph = latestRun ? toGraphViewData(latestRun) : null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reasoning Graph</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Source-backed text-network analysis for selected corpus scopes. The default Maria materials scope is intended for ontology curation; other scopes are for review and diagnostics.
        </p>
      </div>

      <AdminStatusBanner message={statusMessage} />

      <Card>
        <CardHeader>
          <CardTitle>Generate graph</CardTitle>
          <p className="text-sm text-muted-foreground">
            Deterministic graph structure comes first. AI interpretations can be layered later, but this view never changes public app behavior.
          </p>
        </CardHeader>
        <CardContent>
          <form action={generateReasoningGraphAction} className="grid gap-3 md:grid-cols-[1fr_160px_1fr_auto]">
            <label className="grid gap-1 text-xs font-medium">
              Reasoning scope
              <select name="sourceScope" defaultValue="maria_materials" className="rounded-md border bg-background px-3 py-2 text-sm">
                {REASONING_SCOPES.map((scope) => (
                  <option key={scope} value={scope}>
                    {reasoningScopeLabel(scope)} ({sourceScopes.find((item) => item.reasoningScope === scope)?._count._all ?? 0})
                  </option>
                ))}
                <option value="all">All approved scopes (diagnostic)</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Max chunks
              <input name="maxChunks" type="number" min={10} max={500} defaultValue={180} className="rounded-md border bg-background px-3 py-2 text-sm" />
            </label>
            <label className="grid gap-1 text-xs font-medium">
              Audit reason
              <input name="reason" required minLength={10} placeholder="Reason for generating this graph" className="rounded-md border bg-background px-3 py-2 text-sm" />
            </label>
            <div className="flex items-end">
              <SubmitButton pendingLabel="Generating graph..." className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50">
                Generate graph
              </SubmitButton>
            </div>
          </form>
        </CardContent>
      </Card>

      {failedRun && (
        <Card>
          <CardHeader><CardTitle>Latest failed run</CardTitle></CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>{formatAdminDateTime(failedRun.createdAt)}</p>
            <p className="mt-1">{failedRun.errorMessage}</p>
          </CardContent>
        </Card>
      )}

      {latestRun && graph ? (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Metric title="Nodes" value={latestRun.nodeCount} />
            <Metric title="Edges" value={latestRun.edgeCount} />
            <Metric title="Clusters" value={latestRun.clusterCount} />
            <Metric title="Insights" value={latestRun.insightCount} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Graph canvas</CardTitle>
              <p className="text-sm text-muted-foreground">
                Latest completed run: {formatAdminDateTime(latestRun.createdAt)} · scope {reasoningScopeLabel(latestRun.sourceScope)}
              </p>
            </CardHeader>
            <CardContent>
              <ReasoningGraphView graph={graph} />
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
            <Card>
              <CardHeader><CardTitle>Clusters</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {latestRun.clusters.map((cluster) => (
                  <div key={cluster.id} className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium">{cluster.label}</p>
                      <p className="text-xs text-muted-foreground">{cluster.size} nodes</p>
                    </div>
                    {cluster.summary && <p className="mt-1 text-xs text-muted-foreground">{cluster.summary}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Gaps, bridges, and review queue</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {latestRun.insights.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No graph insights generated yet.</p>
                ) : latestRun.insights.map((insight) => (
                  <div key={insight.id} className="rounded-md border p-3 text-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="font-medium">{insight.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {insight.insightType} · confidence {Math.round(insight.confidence * 100)}% · {insight.reviewState}
                      </p>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{insight.summary}</p>
                    <div className="mt-2 space-y-1">
                      {insight.evidence.map((item) => (
                        <p key={item.id} className="rounded bg-muted/30 px-2 py-1 text-xs text-muted-foreground">
                          {item.sourceDocument?.title ?? "Source"}: {item.excerpt ?? "No excerpt stored."}
                        </p>
                      ))}
                    </div>
                    <form action={reviewReasoningGraphItemAction} className="mt-3 flex flex-wrap gap-2">
                      <input type="hidden" name="targetType" value="insight" />
                      <input type="hidden" name="targetId" value={insight.id} />
                      <select name="reviewState" defaultValue={insight.reviewState} className="rounded-md border bg-background px-2 py-1 text-xs">
                        {["unreviewed", "approved", "rejected", "needs_revision"].map((state) => <option key={state} value={state}>{state}</option>)}
                      </select>
                      <input name="reason" required minLength={10} placeholder="Review reason" className="min-w-64 rounded-md border bg-background px-2 py-1 text-xs" />
                      <SubmitButton pendingLabel="Saving...">Save review</SubmitButton>
                    </form>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardHeader><CardTitle>No graph generated yet</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Generate the first reasoning graph after approving source documents, rights grants, and source chunks.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function reasoningScopeLabel(scope: string) {
  if (scope === "maria_materials") return "Maria materials"
  if (scope === "product_doctrine") return "Product doctrine"
  if (scope === "curriculum") return "Curriculum"
  if (scope === "reference_only") return "Reference only"
  if (scope === "excluded") return "Excluded"
  if (scope === "all") return "All approved scopes"
  return scope
}

function Metric({ title, value }: { title: string; value: string | number }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="text-3xl font-semibold">{value}</CardContent>
    </Card>
  )
}

function toGraphViewData(run: {
  nodes: Array<{
    id: string
    nodeKey: string
    label: string
    cluster: { clusterKey: number } | null
    degree: number
    weightedDegree: number
    betweenness: number
    bridgeScore: number
    reviewState: string
    evidence: Array<{ excerpt: string | null; sourceDocument: { title: string } | null }>
  }>
  edges: Array<{
    id: string
    fromNodeId: string
    toNodeId: string
    weight: number
    confidence: number
    reviewState: string
    rationale: string | null
  }>
}): ReasoningGraphViewData {
  return {
    nodes: run.nodes.slice(0, 90).map((node) => ({
      id: node.id,
      key: node.nodeKey,
      label: node.label,
      clusterKey: node.cluster?.clusterKey ?? null,
      degree: node.degree,
      weightedDegree: node.weightedDegree,
      betweenness: node.betweenness,
      bridgeScore: node.bridgeScore,
      reviewState: node.reviewState,
      evidence: node.evidence.map((item) => ({
        excerpt: item.excerpt,
        sourceTitle: item.sourceDocument?.title ?? null,
      })),
    })),
    edges: run.edges.slice(0, 260).map((edge) => ({
      id: edge.id,
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      weight: edge.weight,
      confidence: edge.confidence,
      reviewState: edge.reviewState,
      rationale: edge.rationale,
    })),
  }
}
