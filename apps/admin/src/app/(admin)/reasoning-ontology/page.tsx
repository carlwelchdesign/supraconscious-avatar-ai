import { Card, CardContent, CardHeader, CardTitle } from "@inner-avatar/ui/card"
import { prisma } from "@inner-avatar/db"
import { isReasoningGraphConceptAllowed } from "@inner-avatar/ai"
import { AdminStatusBanner } from "@/components/admin-status-banner"
import { SubmitButton } from "@/components/submit-button"
import { createReasoningOntologyBridgeAction, promoteReasoningOntologyCandidateAction } from "./actions"

const STATUS_MESSAGES: Record<string, { tone: "success" | "error"; message: string }> = {
  promoted: { tone: "success", message: "Candidate promoted into the approved reasoning ontology." },
  bridge_created: { tone: "success", message: "Bridge relationship created in the approved reasoning ontology." },
  invalid: { tone: "error", message: "Ontology action needs a valid candidate, relationship, and audit reason." },
  not_promotable: { tone: "error", message: "That candidate is not promotable because it is noisy, weakly connected, or outside the Maria materials scope." },
}

export default async function ReasoningOntologyPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const statusMessage = status ? STATUS_MESSAGES[status] : null
  const [concepts, relationships, clusters, outcomes, latestRun] = await Promise.all([
    prisma.reasoningOntologyConcept.findMany({
      where: { reviewState: "approved" },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 40,
      include: { evidence: { take: 2 } },
    }),
    prisma.reasoningOntologyRelationship.findMany({
      where: { reviewState: "approved" },
      orderBy: [{ updatedAt: "desc" }],
      take: 40,
      include: { fromConcept: true, toConcept: true },
    }),
    prisma.reasoningOntologyCluster.findMany({
      where: { reviewState: "approved" },
      orderBy: [{ updatedAt: "desc" }],
      take: 20,
      include: { concepts: { take: 8, include: { concept: true } } },
    }),
    prisma.reasoningOntologyOutcome.findMany({
      where: { reviewState: "approved" },
      orderBy: [{ updatedAt: "desc" }],
      take: 20,
      include: { concepts: { take: 8, include: { concept: true } } },
    }),
    prisma.reasoningGraphRun.findFirst({
      where: { status: "completed", NOT: { sourceScope: "approved_sources" } },
      orderBy: { createdAt: "desc" },
      include: {
        nodes: {
          orderBy: [{ bridgeScore: "desc" }, { weightedDegree: "desc" }],
          take: 10,
          include: { evidence: { take: 4, include: { sourceDocument: { select: { title: true, sourceType: true, author: true, reasoningScope: true } } } } },
        },
        edges: {
          orderBy: [{ weight: "desc" }, { confidence: "desc" }],
          take: 10,
          include: {
            fromNode: true,
            toNode: true,
            evidence: { take: 4, include: { sourceDocument: { select: { title: true, sourceType: true, author: true, reasoningScope: true } } } },
          },
        },
        clusters: {
          orderBy: [{ size: "desc" }],
          take: 8,
          include: {
            nodes: {
              take: 6,
              include: {
                evidence: {
                  take: 2,
                  include: { sourceDocument: { select: { title: true, sourceType: true, author: true, reasoningScope: true } } },
                },
              },
            },
          },
        },
        insights: {
          orderBy: [{ confidence: "desc" }],
          take: 8,
          include: {
            evidence: {
              take: 4,
              include: { sourceDocument: { select: { title: true, sourceType: true, author: true, reasoningScope: true } } },
            },
          },
        },
      },
    }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reasoning Ontology</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
          Curated concepts, typed relationships, clusters, and stakeholder paths promoted from generated reasoning graph runs. Only approved ontology records are eligible for future GraphRAG retrieval.
        </p>
      </div>

      <AdminStatusBanner message={statusMessage} />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric title="Approved concepts" value={concepts.length} />
        <Metric title="Relationships" value={relationships.length} />
        <Metric title="Clusters" value={clusters.length} />
        <Metric title="Outcomes" value={outcomes.length} />
      </div>

      <Card>
        <CardHeader><CardTitle>Manual bridge</CardTitle></CardHeader>
        <CardContent>
          <form action={createReasoningOntologyBridgeAction} className="grid gap-3 md:grid-cols-[1fr_1fr_180px_1fr_1fr_auto]">
            <select name="fromConceptId" required className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">From concept</option>
              {concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.canonicalLabel}</option>)}
            </select>
            <select name="toConceptId" required className="rounded-md border bg-background px-3 py-2 text-sm">
              <option value="">To concept</option>
              {concepts.map((concept) => <option key={concept.id} value={concept.id}>{concept.canonicalLabel}</option>)}
            </select>
            <select name="relationType" defaultValue="gap_bridge" className="rounded-md border bg-background px-3 py-2 text-sm">
              {["gap_bridge", "supports", "tension", "causal", "hierarchical", "associative", "practice_to_outcome"].map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
            <input name="rationale" required minLength={10} placeholder="Bridge rationale" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <input name="reason" required minLength={10} placeholder="Audit reason" className="rounded-md border bg-background px-3 py-2 text-sm" />
            <SubmitButton pendingLabel="Saving...">Create bridge</SubmitButton>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Approved concepts</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {concepts.length === 0 ? <Empty message="No approved ontology concepts yet." /> : concepts.map((concept) => (
              <div key={concept.id} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{concept.canonicalLabel}</p>
                  {concept.pinned && <span className="text-xs text-muted-foreground">Pinned</span>}
                </div>
                {concept.description && <p className="mt-1 text-xs text-muted-foreground">{concept.description}</p>}
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Approved relationships</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {relationships.length === 0 ? <Empty message="No approved ontology relationships yet." /> : relationships.map((relationship) => (
              <div key={relationship.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{relationship.fromConcept.canonicalLabel} → {relationship.toConcept.canonicalLabel}</p>
                <p className="mt-1 text-xs text-muted-foreground">{relationship.relationType} · confidence {Math.round(relationship.confidence * 100)}%</p>
                {relationship.rationale && <p className="mt-1 text-xs text-muted-foreground">{relationship.rationale}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Approved clusters</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {clusters.length === 0 ? <Empty message="No approved ontology clusters yet." /> : clusters.map((cluster) => (
              <div key={cluster.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{cluster.label}</p>
                {cluster.summary && <p className="mt-1 text-xs text-muted-foreground">{cluster.summary}</p>}
                <p className="mt-2 text-xs text-muted-foreground">{cluster.concepts.map((item) => item.concept.canonicalLabel).join(", ")}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Stakeholder outcome paths</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {outcomes.length === 0 ? <Empty message="No approved stakeholder paths yet." /> : outcomes.map((outcome) => (
              <div key={outcome.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{outcome.label}</p>
                {outcome.summary && <p className="mt-1 text-xs text-muted-foreground">{outcome.summary}</p>}
                {outcome.missingAreas.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Missing: {outcome.missingAreas.join(", ")}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Latest graph candidates</CardTitle>
          <p className="text-sm text-muted-foreground">Promote only source-backed candidates that should become canonical ontology.</p>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          {!latestRun ? <Empty message="Generate a reasoning graph before promoting ontology candidates." /> : (
            <>
              <CandidateList title="Concept candidates" items={latestRun.nodes.map((node) => ({
                id: node.id,
                label: node.label,
                detail: node.summary ?? "",
                type: "concept" as const,
                evidence: evidenceSummary(node.evidence),
                promotable: latestRun.sourceScope === "maria_materials" && isPromotableConceptCandidate(node),
              }))} />
              <CandidateList title="Relationship candidates" items={latestRun.edges.map((edge) => ({
                id: edge.id,
                label: `${edge.fromNode.label} → ${edge.toNode.label}`,
                detail: `${edge.relationType} · weight ${edge.weight}`,
                type: "relationship" as const,
                evidence: evidenceSummary(edge.evidence),
                promotable: latestRun.sourceScope === "maria_materials" &&
                  edge.weight >= 2 &&
                  isReasoningGraphConceptAllowed(edge.fromNode.label) &&
                  isReasoningGraphConceptAllowed(edge.fromNode.nodeKey) &&
                  isReasoningGraphConceptAllowed(edge.toNode.label) &&
                  isReasoningGraphConceptAllowed(edge.toNode.nodeKey) &&
                  hasMariaEvidence(edge.evidence),
              }))} />
              <CandidateList title="Cluster candidates" items={latestRun.clusters.map((cluster) => ({
                id: cluster.id,
                label: cluster.label,
                detail: cluster.summary ?? "",
                type: "cluster" as const,
                evidence: evidenceSummary(cluster.nodes.flatMap((node) => node.evidence)),
                promotable: latestRun.sourceScope === "maria_materials" && cluster.nodes.some(isPromotableConceptCandidate),
              }))} />
              <CandidateList title="Outcome / gap candidates" items={latestRun.insights.map((insight) => ({
                id: insight.id,
                label: insight.title,
                detail: insight.summary,
                type: "outcome" as const,
                evidence: evidenceSummary(insight.evidence),
                promotable: latestRun.sourceScope === "maria_materials" && hasMariaEvidence(insight.evidence),
              }))} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CandidateList({ title, items }: { title: string; items: Array<{ id: string; label: string; detail: string; type: "concept" | "relationship" | "cluster" | "outcome"; evidence: string; promotable: boolean }> }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {items.length === 0 ? <Empty message="No candidates." /> : items.map((item) => (
        <div key={item.id} className="rounded-md border p-3 text-sm">
          <p className="font-medium">{item.label}</p>
          {item.detail && <p className="mt-1 text-xs text-muted-foreground">{item.detail}</p>}
          <p className="mt-2 text-xs text-muted-foreground">{item.evidence}</p>
          {item.promotable ? (
            <form action={promoteReasoningOntologyCandidateAction} className="mt-3 flex gap-2">
              <input type="hidden" name="targetType" value={item.type} />
              <input type="hidden" name="targetId" value={item.id} />
              <input name="reason" required minLength={10} placeholder="Audit reason" className="min-w-0 flex-1 rounded-md border bg-background px-2 py-1 text-xs" />
              <SubmitButton pendingLabel="Promoting...">Promote</SubmitButton>
            </form>
          ) : (
            <p className="mt-3 rounded-md border bg-muted/30 px-2 py-1 text-xs text-muted-foreground">Not promotable for Maria ontology.</p>
          )}
        </div>
      ))}
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

function Empty({ message }: { message: string }) {
  return <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">{message}</p>
}

function isPromotableConceptCandidate(candidate: { label: string; nodeKey: string; evidence?: Array<{ sourceDocument: { reasoningScope: string } | null }> }) {
  return isReasoningGraphConceptAllowed(candidate.label) &&
    isReasoningGraphConceptAllowed(candidate.nodeKey) &&
    hasMariaEvidence(candidate.evidence ?? [])
}

function hasMariaEvidence(evidence: Array<{ sourceDocument: { reasoningScope: string } | null }>) {
  return evidence.length > 0 && evidence.every((item) => item.sourceDocument?.reasoningScope === "maria_materials")
}

function evidenceSummary(evidence: Array<{ sourceDocument: { title: string; sourceType: string; author: string | null; reasoningScope: string } | null }>) {
  const documents = new Map<string, { title: string; sourceType: string; author: string | null; reasoningScope: string; count: number }>()
  for (const item of evidence) {
    const source = item.sourceDocument
    if (!source) continue
    const existing = documents.get(source.title)
    documents.set(source.title, { ...source, count: (existing?.count ?? 0) + 1 })
  }
  if (documents.size === 0) return "No source evidence."
  return Array.from(documents.values())
    .slice(0, 3)
    .map((source) => `${source.title} · ${source.sourceType} · ${source.reasoningScope} · ${source.author ?? "unknown author"} · ${source.count} evidence`)
    .join("; ")
}
