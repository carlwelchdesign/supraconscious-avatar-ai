import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { zodTextFormat } from "openai/helpers/zod"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import type { BuiltReasoningGraph } from "./reasoning-graph.js"
import type { EntryAnalysis } from "./schemas.js"

export const REASONING_ONTOLOGY_PROMPT_VERSION = "reasoning-ontology-v1"

export const REASONING_ONTOLOGY_RELATION_TYPES = [
  "causal",
  "hierarchical",
  "associative",
  "tension",
  "practice_to_outcome",
  "supports",
  "gap_bridge",
] as const

export type ReasoningOntologyRelationType = typeof REASONING_ONTOLOGY_RELATION_TYPES[number]

export const ReasoningOntologyProposalSchema = z.object({
  concepts: z.array(z.object({
    nodeKey: z.string().trim().min(1),
    canonicalLabel: z.string().trim().min(2).max(120),
    aliases: z.array(z.string().trim().min(1).max(120)).default([]),
    description: z.string().trim().min(8).max(800),
    sourceChunkIds: z.array(z.string().trim().min(1)).min(1),
  })).default([]),
  relationships: z.array(z.object({
    fromNodeKey: z.string().trim().min(1),
    toNodeKey: z.string().trim().min(1),
    relationType: z.enum(REASONING_ONTOLOGY_RELATION_TYPES),
    rationale: z.string().trim().min(8).max(900),
    confidence: z.number().min(0).max(1),
    sourceChunkIds: z.array(z.string().trim().min(1)).min(1),
  })).default([]),
  clusters: z.array(z.object({
    clusterKey: z.number().int().nonnegative(),
    label: z.string().trim().min(2).max(140),
    summary: z.string().trim().min(8).max(900),
    centralNodeKeys: z.array(z.string().trim().min(1)).min(1),
    sourceChunkIds: z.array(z.string().trim().min(1)).min(1),
  })).default([]),
  gaps: z.array(z.object({
    title: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(8).max(900),
    nodeKeys: z.array(z.string().trim().min(1)).min(2),
    bridgeQuestion: z.string().trim().min(8).max(500),
    proposedBridgeConcepts: z.array(z.string().trim().min(2).max(120)).default([]),
    sourceChunkIds: z.array(z.string().trim().min(1)).min(1),
  })).default([]),
  stakeholderPaths: z.array(z.object({
    outcomeLabel: z.string().trim().min(3).max(160),
    summary: z.string().trim().min(8).max(900),
    supportingNodeKeys: z.array(z.string().trim().min(1)).min(1),
    missingAreas: z.array(z.string().trim().min(2).max(160)).default([]),
    sourceChunkIds: z.array(z.string().trim().min(1)).min(1),
  })).default([]),
})

export type ReasoningOntologyProposal = z.infer<typeof ReasoningOntologyProposalSchema>

export async function generateReasoningOntologyProposal(graph: BuiltReasoningGraph): Promise<{
  status: "generated" | "unavailable"
  proposal: ReasoningOntologyProposal | null
  errorMessage?: string
}> {
  if (!isOpenAIConfigured()) {
    return { status: "unavailable", proposal: null }
  }

  try {
    const response = await getOpenAIClient().responses.parse({
      model: reflectiveModel,
      input: [
        {
          role: "system",
          content: `You are building an admin-only reasoning ontology from a source-backed graph.
Return structured JSON only.
Use only provided node keys, cluster keys, edge evidence, and sourceChunkIds.
Classify relationships as causal, hierarchical, associative, tension, practice_to_outcome, supports, or gap_bridge.
Do not invent claims or cite unknown evidence.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            nodes: graph.nodes.slice(0, 60).map((node) => ({
              key: node.key,
              label: node.label,
              clusterKey: node.clusterKey,
              summary: node.summary,
              sourceChunkIds: node.sourceChunkIds.slice(0, 6),
            })),
            edges: graph.edges.slice(0, 120).map((edge) => ({
              fromKey: edge.fromKey,
              toKey: edge.toKey,
              weight: edge.weight,
              rationale: edge.rationale,
              sourceChunkIds: edge.sourceChunkIds.slice(0, 6),
            })),
            clusters: graph.clusters,
          }),
        },
      ],
      text: {
        format: zodTextFormat(ReasoningOntologyProposalSchema, "reasoning_ontology_proposal"),
      },
    })

    if (!response.output_parsed) {
      throw new Error("Reasoning ontology proposal generator returned no structured output.")
    }

    return {
      status: "generated",
      proposal: validateReasoningOntologyProposal(response.output_parsed, graph),
    }
  } catch (error) {
    return {
      status: "unavailable",
      proposal: null,
      errorMessage: error instanceof Error ? error.message : "Reasoning ontology proposal generation failed.",
    }
  }
}

export function validateReasoningOntologyProposal(
  input: unknown,
  graph: { nodes: Array<{ key: string }>; clusters: Array<{ key: number }>; sourceChunkIds: string[] },
): ReasoningOntologyProposal {
  const parsed = ReasoningOntologyProposalSchema.parse(input)
  const nodeKeys = new Set(graph.nodes.map((node) => node.key))
  const clusterKeys = new Set(graph.clusters.map((cluster) => cluster.key))
  const sourceChunkIds = new Set(graph.sourceChunkIds)

  for (const concept of parsed.concepts) {
    assertKnownNode(concept.nodeKey, nodeKeys)
    assertKnownEvidence(concept.sourceChunkIds, sourceChunkIds)
  }
  for (const relationship of parsed.relationships) {
    assertKnownNode(relationship.fromNodeKey, nodeKeys)
    assertKnownNode(relationship.toNodeKey, nodeKeys)
    assertKnownEvidence(relationship.sourceChunkIds, sourceChunkIds)
  }
  for (const cluster of parsed.clusters) {
    if (!clusterKeys.has(cluster.clusterKey)) throw new Error("Reasoning ontology proposal references an unknown cluster.")
    cluster.centralNodeKeys.forEach((key) => assertKnownNode(key, nodeKeys))
    assertKnownEvidence(cluster.sourceChunkIds, sourceChunkIds)
  }
  for (const gap of parsed.gaps) {
    gap.nodeKeys.forEach((key) => assertKnownNode(key, nodeKeys))
    assertKnownEvidence(gap.sourceChunkIds, sourceChunkIds)
  }
  for (const path of parsed.stakeholderPaths) {
    path.supportingNodeKeys.forEach((key) => assertKnownNode(key, nodeKeys))
    assertKnownEvidence(path.sourceChunkIds, sourceChunkIds)
  }

  return parsed
}

export type ApprovedOntologyNeighborhood = {
  enabled: boolean
  concepts: GraphRagConcept[]
  relationships: GraphRagRelationship[]
  bridgeQuestions: string[]
  paths?: GraphRagPath[]
  gaps?: GraphRagGap[]
  stakeholderPaths?: GraphRagStakeholderPath[]
  sourceChunkIds?: string[]
  trace?: GraphRagRetrievalTrace
}

export type GraphRagEvidence = {
  sourceChunkId: string | null
  excerpt: string | null
  weight?: number
}

export type GraphRagConcept = {
  id: string
  label: string
  description: string | null
  aliases: string[]
  pinned: boolean
  score: number
  evidence: GraphRagEvidence[]
  clusterLabels: string[]
  outcomeLabels: string[]
}

export type GraphRagRelationship = {
  id: string
  fromConceptId: string
  toConceptId: string
  fromLabel: string
  toLabel: string
  relationType: ReasoningOntologyRelationType
  rationale: string | null
  confidence: number
  score: number
  evidence: GraphRagEvidence[]
}

export type GraphRagPath = {
  conceptIds: string[]
  relationshipIds: string[]
  labels: string[]
  relationTypes: ReasoningOntologyRelationType[]
  summary: string
  score: number
  evidenceSourceChunkIds: string[]
}

export type GraphRagGap = {
  title: string
  summary: string | null
  missingAreas: string[]
  supportingConceptIds: string[]
}

export type GraphRagStakeholderPath = {
  id: string
  label: string
  summary: string | null
  missingAreas: string[]
  conceptIds: string[]
  evidenceSourceChunkIds: string[]
}

export type GraphRagRetrievalTrace = {
  enabled: boolean
  status: "disabled" | "selected" | "empty" | "failed"
  queryTerms: string[]
  selectedConceptIds: string[]
  selectedRelationshipIds: string[]
  selectedSourceChunkIds: string[]
  pathSummaries: string[]
  fallbackReason?: string
  latencyMs?: number
}

export type GraphRagContext = ApprovedOntologyNeighborhood & {
  paths: GraphRagPath[]
  gaps: GraphRagGap[]
  stakeholderPaths: GraphRagStakeholderPath[]
  sourceChunkIds: string[]
  trace: GraphRagRetrievalTrace
}

export async function retrieveApprovedOntologyNeighborhood(
  query: string,
  options: { limit?: number; enabled?: boolean; analysis?: EntryAnalysis; maxHops?: 1 | 2 } = {},
): Promise<GraphRagContext> {
  return buildGraphRagContext(query, options)
}

export async function buildGraphRagContext(
  query: string,
  options: { limit?: number; enabled?: boolean; analysis?: EntryAnalysis; maxHops?: 1 | 2 } = {},
): Promise<GraphRagContext> {
  const startedAt = Date.now()
  const enabled = options.enabled ?? await isOntologyRagEnabled()
  if (!enabled) {
    return emptyGraphRagContext(false, "disabled", [], startedAt)
  }

  const terms = extractOntologySearchTerms(query, options.analysis)
  if (terms.length === 0) {
    return emptyGraphRagContext(true, "empty", [], startedAt, "No usable ontology search terms were found.")
  }

  const limit = options.limit ?? 6
  const matchedConcepts = await prisma.reasoningOntologyConcept.findMany({
    where: {
      reviewState: "approved",
      OR: terms.flatMap((term) => [
        { canonicalLabel: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
        { aliases: { has: term } },
      ]),
    },
    take: Math.max(limit * 2, limit),
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      evidence: { take: 5, select: { sourceChunkId: true, excerpt: true, weight: true } },
      clusterMemberships: {
        include: {
          cluster: {
            select: { id: true, label: true, summary: true, reviewState: true },
          },
        },
      },
      outcomeLinks: {
        include: {
          outcome: {
            select: { id: true, label: true, summary: true, missingAreas: true, reviewState: true, evidence: { take: 4, select: { sourceChunkId: true, excerpt: true, weight: true } } },
          },
        },
      },
      outgoingRelationships: {
        where: { reviewState: "approved" },
        take: 8,
        include: {
          toConcept: {
            select: {
              id: true,
              canonicalLabel: true,
              description: true,
              aliases: true,
              pinned: true,
              reviewState: true,
              evidence: { take: 4, select: { sourceChunkId: true, excerpt: true, weight: true } },
            },
          },
          evidence: { take: 4, select: { sourceChunkId: true, excerpt: true, weight: true } },
        },
      },
      incomingRelationships: {
        where: { reviewState: "approved" },
        take: 8,
        include: {
          fromConcept: {
            select: {
              id: true,
              canonicalLabel: true,
              description: true,
              aliases: true,
              pinned: true,
              reviewState: true,
              evidence: { take: 4, select: { sourceChunkId: true, excerpt: true, weight: true } },
            },
          },
          evidence: { take: 4, select: { sourceChunkId: true, excerpt: true, weight: true } },
        },
      },
    },
  })

  if (matchedConcepts.length === 0) {
    return emptyGraphRagContext(true, "empty", terms, startedAt, "No approved ontology concepts matched the entry.")
  }

  const selectedConcepts = matchedConcepts
    .map((concept) => ({
      concept,
      score: scoreConceptMatch({
        label: concept.canonicalLabel,
        description: concept.description,
        aliases: concept.aliases,
        pinned: concept.pinned,
        evidenceCount: concept.evidence.length,
      }, terms),
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)

  const selectedConceptIds = new Set(selectedConcepts.map((item) => item.concept.id))
  const firstHopRelationships = selectedConcepts.flatMap(({ concept, score }) => [
    ...concept.outgoingRelationships
      .filter((relationship) => relationship.toConcept.reviewState === "approved")
      .map((relationship) => ({
      id: relationship.id,
        fromConceptId: concept.id,
        toConceptId: relationship.toConcept.id,
      fromLabel: concept.canonicalLabel,
      toLabel: relationship.toConcept.canonicalLabel,
      relationType: relationship.relationType as ReasoningOntologyRelationType,
      rationale: relationship.rationale,
        confidence: relationship.confidence,
        score: scoreRelationship(relationship.confidence, relationship.evidence.length, score),
      evidence: relationship.evidence,
    })),
    ...concept.incomingRelationships
      .filter((relationship) => relationship.fromConcept.reviewState === "approved")
      .map((relationship) => ({
      id: relationship.id,
        fromConceptId: relationship.fromConcept.id,
        toConceptId: concept.id,
      fromLabel: relationship.fromConcept.canonicalLabel,
      toLabel: concept.canonicalLabel,
      relationType: relationship.relationType as ReasoningOntologyRelationType,
      rationale: relationship.rationale,
        confidence: relationship.confidence,
        score: scoreRelationship(relationship.confidence, relationship.evidence.length, score),
      evidence: relationship.evidence,
    })),
  ])

  const neighborIds = Array.from(new Set(firstHopRelationships.flatMap((relationship) => [relationship.fromConceptId, relationship.toConceptId])))
    .filter((id) => !selectedConceptIds.has(id))
    .slice(0, limit * 2)
  const secondHopRelationships = options.maxHops === 1 || neighborIds.length === 0
    ? []
    : await prisma.reasoningOntologyRelationship.findMany({
        where: {
          reviewState: "approved",
          OR: [
            { fromConceptId: { in: neighborIds } },
            { toConceptId: { in: neighborIds } },
          ],
        },
        take: limit * 3,
        include: {
          fromConcept: { select: { id: true, canonicalLabel: true, reviewState: true } },
          toConcept: { select: { id: true, canonicalLabel: true, reviewState: true } },
          evidence: { take: 4, select: { sourceChunkId: true, excerpt: true, weight: true } },
        },
      })

  const relationships = dedupeRelationships([
    ...firstHopRelationships,
    ...secondHopRelationships
      .filter((relationship) => relationship.fromConcept.reviewState === "approved" && relationship.toConcept.reviewState === "approved")
      .map((relationship) => ({
        id: relationship.id,
        fromConceptId: relationship.fromConceptId,
        toConceptId: relationship.toConceptId,
        fromLabel: relationship.fromConcept.canonicalLabel,
        toLabel: relationship.toConcept.canonicalLabel,
        relationType: relationship.relationType as ReasoningOntologyRelationType,
        rationale: relationship.rationale,
        confidence: relationship.confidence,
        score: scoreRelationship(relationship.confidence, relationship.evidence.length, 0.5),
        evidence: relationship.evidence,
      })),
  ]).sort((left, right) => right.score - left.score).slice(0, 14)

  const conceptById = new Map<string, GraphRagConcept>()
  for (const { concept, score } of selectedConcepts) {
    conceptById.set(concept.id, {
      id: concept.id,
      label: concept.canonicalLabel,
      description: concept.description,
      aliases: concept.aliases,
      pinned: concept.pinned,
      score: Number(score.toFixed(3)),
      evidence: concept.evidence,
      clusterLabels: concept.clusterMemberships
        .filter((membership) => membership.cluster.reviewState === "approved")
        .map((membership) => membership.cluster.label),
      outcomeLabels: concept.outcomeLinks
        .filter((link) => link.outcome.reviewState === "approved")
        .map((link) => link.outcome.label),
    })
  }
  for (const relationship of relationships) {
    if (!conceptById.has(relationship.fromConceptId)) {
      conceptById.set(relationship.fromConceptId, {
        id: relationship.fromConceptId,
        label: relationship.fromLabel,
        description: null,
        aliases: [],
        pinned: false,
        score: Number(Math.max(0.1, relationship.score * 0.35).toFixed(3)),
        evidence: [],
        clusterLabels: [],
        outcomeLabels: [],
      })
    }
    if (!conceptById.has(relationship.toConceptId)) {
      conceptById.set(relationship.toConceptId, {
        id: relationship.toConceptId,
        label: relationship.toLabel,
        description: null,
        aliases: [],
        pinned: false,
        score: Number(Math.max(0.1, relationship.score * 0.35).toFixed(3)),
        evidence: [],
        clusterLabels: [],
        outcomeLabels: [],
      })
    }
  }

  const concepts = Array.from(conceptById.values())
    .sort((left, right) => right.score - left.score)
    .slice(0, limit + 8)

  const outcomes = selectedConcepts.flatMap(({ concept }) => concept.outcomeLinks
    .filter((link) => link.outcome.reviewState === "approved")
    .map((link) => link.outcome))
  const stakeholderPaths = dedupeStakeholderPaths(outcomes).slice(0, 4).map((outcome) => ({
    id: outcome.id,
    label: outcome.label,
    summary: outcome.summary,
    missingAreas: outcome.missingAreas,
    conceptIds: selectedConcepts
      .filter(({ concept }) => concept.outcomeLinks.some((link) => link.outcome.id === outcome.id))
      .map(({ concept }) => concept.id),
    evidenceSourceChunkIds: extractSourceChunkIds(outcome.evidence),
  }))

  const paths = buildGraphRagPaths(concepts, relationships)
    .sort((left, right) => right.score - left.score)
    .slice(0, 8)
  const gaps = stakeholderPaths
    .filter((path) => path.missingAreas.length > 0)
    .map((path) => ({
      title: path.label,
      summary: path.summary,
      missingAreas: path.missingAreas,
      supportingConceptIds: path.conceptIds,
    }))
    .slice(0, 4)
  const bridgeQuestions = [
    ...paths
      .filter((path) => path.relationTypes.includes("gap_bridge"))
      .map((path) => `Bridge path: ${path.summary}`),
    ...stakeholderPaths.flatMap((item) => item.missingAreas.map((area) => `Missing/underconnected area: ${area}`)),
  ].slice(0, 6)
  const sourceChunkIds = Array.from(new Set([
    ...concepts.flatMap((concept) => extractSourceChunkIds(concept.evidence)),
    ...relationships.flatMap((relationship) => extractSourceChunkIds(relationship.evidence)),
    ...paths.flatMap((path) => path.evidenceSourceChunkIds),
    ...stakeholderPaths.flatMap((path) => path.evidenceSourceChunkIds),
  ])).slice(0, 12)

  return {
    enabled: true,
    concepts,
    relationships,
    paths,
    gaps,
    stakeholderPaths,
    bridgeQuestions,
    sourceChunkIds,
    trace: {
      enabled: true,
      status: sourceChunkIds.length || concepts.length || relationships.length ? "selected" : "empty",
      queryTerms: terms,
      selectedConceptIds: concepts.map((concept) => concept.id),
      selectedRelationshipIds: relationships.map((relationship) => relationship.id),
      selectedSourceChunkIds: sourceChunkIds,
      pathSummaries: paths.map((path) => path.summary),
      latencyMs: Date.now() - startedAt,
    },
  }
}

async function isOntologyRagEnabled() {
  const flag = await prisma.featureFlag.findUnique({
    where: { key: "ontology_rag_enabled" },
    select: { enabled: true },
  })
  return flag?.enabled ?? false
}

function assertKnownNode(key: string, nodeKeys: Set<string>) {
  if (!nodeKeys.has(key)) throw new Error("Reasoning ontology proposal references an unknown node.")
}

function assertKnownEvidence(ids: string[], sourceChunkIds: Set<string>) {
  if (!ids.every((id) => sourceChunkIds.has(id))) {
    throw new Error("Reasoning ontology proposal references unknown source evidence.")
  }
}

function emptyGraphRagContext(
  enabled: boolean,
  status: GraphRagRetrievalTrace["status"],
  terms: string[],
  startedAt: number,
  fallbackReason?: string,
): GraphRagContext {
  return {
    enabled,
    concepts: [],
    relationships: [],
    paths: [],
    gaps: [],
    stakeholderPaths: [],
    bridgeQuestions: [],
    sourceChunkIds: [],
    trace: {
      enabled,
      status,
      queryTerms: terms,
      selectedConceptIds: [],
      selectedRelationshipIds: [],
      selectedSourceChunkIds: [],
      pathSummaries: [],
      fallbackReason,
      latencyMs: Date.now() - startedAt,
    },
  }
}

function extractOntologySearchTerms(query: string, analysis?: EntryAnalysis) {
  const analysisTerms = [
    analysis?.summary,
    ...(analysis?.behavioralPatterns ?? []).flatMap((pattern) => [pattern.label, ...(pattern.evidence ?? [])]),
    ...(analysis?.contradictionSignals ?? []).flatMap((signal) => [signal.statedDesire, signal.conflictingBehavior]),
    ...(analysis?.emotionalSignals.primary ?? []),
    ...(analysis?.emotionalSignals.secondary ?? []),
  ].filter(Boolean).join(" ")

  return Array.from(new Set(query
    .concat(" ", analysisTerms)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 4 && !ONTOLOGY_STOPWORDS.has(word))))
    .slice(0, 8)
}

function dedupeRelationships(relationships: ApprovedOntologyNeighborhood["relationships"]) {
  const seen = new Set<string>()
  return relationships.filter((relationship) => {
    const key = relationship.id
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function scoreConceptMatch(
  concept: { label: string; description: string | null; aliases: string[]; pinned: boolean; evidenceCount: number },
  terms: string[],
) {
  const label = concept.label.toLowerCase()
  const description = (concept.description ?? "").toLowerCase()
  const aliases = concept.aliases.map((alias) => alias.toLowerCase())
  let score = concept.pinned ? 4 : 0
  score += Math.min(concept.evidenceCount, 5) * 0.4
  for (const term of terms) {
    if (label.includes(term)) score += 5
    if (aliases.some((alias) => alias.includes(term))) score += 4
    if (description.includes(term)) score += 2
  }
  return score
}

function scoreRelationship(confidence: number, evidenceCount: number, seedConceptScore: number) {
  return Number((seedConceptScore * 0.4 + confidence * 5 + Math.min(evidenceCount, 4) * 0.5).toFixed(3))
}

function buildGraphRagPaths(concepts: GraphRagConcept[], relationships: GraphRagRelationship[]): GraphRagPath[] {
  const conceptById = new Map(concepts.map((concept) => [concept.id, concept]))
  return relationships.map((relationship) => {
    const from = conceptById.get(relationship.fromConceptId)
    const to = conceptById.get(relationship.toConceptId)
    const labels = [from?.label ?? relationship.fromLabel, to?.label ?? relationship.toLabel]
    return {
      conceptIds: [relationship.fromConceptId, relationship.toConceptId],
      relationshipIds: [relationship.id],
      labels,
      relationTypes: [relationship.relationType],
      summary: `${labels[0]} -> ${relationship.relationType} -> ${labels[1]}`,
      score: relationship.score,
      evidenceSourceChunkIds: extractSourceChunkIds(relationship.evidence),
    }
  })
}

function extractSourceChunkIds(evidence: GraphRagEvidence[]) {
  return Array.from(new Set(evidence.map((item) => item.sourceChunkId).filter((id): id is string => Boolean(id))))
}

function dedupeStakeholderPaths<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  })
}

const ONTOLOGY_STOPWORDS = new Set(["about", "after", "again", "being", "could", "every", "their", "there", "these", "those", "where", "which", "while", "would", "because", "through", "without"])
