import { z } from "zod"
import { prisma } from "@inner-avatar/db"
import { zodTextFormat } from "openai/helpers/zod"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"
import type { BuiltReasoningGraph } from "./reasoning-graph.js"

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
  concepts: Array<{
    id: string
    label: string
    description: string | null
    aliases: string[]
    evidence: Array<{ sourceChunkId: string | null; excerpt: string | null }>
  }>
  relationships: Array<{
    id: string
    fromLabel: string
    toLabel: string
    relationType: ReasoningOntologyRelationType
    rationale: string | null
    evidence: Array<{ sourceChunkId: string | null; excerpt: string | null }>
  }>
  bridgeQuestions: string[]
}

export async function retrieveApprovedOntologyNeighborhood(
  query: string,
  options: { limit?: number; enabled?: boolean } = {},
): Promise<ApprovedOntologyNeighborhood> {
  const enabled = options.enabled ?? await isOntologyRagEnabled()
  if (!enabled) {
    return { enabled: false, concepts: [], relationships: [], bridgeQuestions: [] }
  }

  const terms = extractOntologySearchTerms(query)
  if (terms.length === 0) {
    return { enabled: true, concepts: [], relationships: [], bridgeQuestions: [] }
  }

  const limit = options.limit ?? 6
  const concepts = await prisma.reasoningOntologyConcept.findMany({
    where: {
      reviewState: "approved",
      OR: terms.flatMap((term) => [
        { canonicalLabel: { contains: term, mode: "insensitive" as const } },
        { description: { contains: term, mode: "insensitive" as const } },
        { aliases: { has: term } },
      ]),
    },
    take: limit,
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    include: {
      evidence: { take: 4, select: { sourceChunkId: true, excerpt: true } },
      outgoingRelationships: {
        where: { reviewState: "approved" },
        take: 6,
        include: {
          toConcept: { select: { canonicalLabel: true } },
          evidence: { take: 3, select: { sourceChunkId: true, excerpt: true } },
        },
      },
      incomingRelationships: {
        where: { reviewState: "approved" },
        take: 6,
        include: {
          fromConcept: { select: { canonicalLabel: true } },
          evidence: { take: 3, select: { sourceChunkId: true, excerpt: true } },
        },
      },
    },
  })

  const relationships = concepts.flatMap((concept) => [
    ...concept.outgoingRelationships.map((relationship) => ({
      id: relationship.id,
      fromLabel: concept.canonicalLabel,
      toLabel: relationship.toConcept.canonicalLabel,
      relationType: relationship.relationType as ReasoningOntologyRelationType,
      rationale: relationship.rationale,
      evidence: relationship.evidence,
    })),
    ...concept.incomingRelationships.map((relationship) => ({
      id: relationship.id,
      fromLabel: relationship.fromConcept.canonicalLabel,
      toLabel: concept.canonicalLabel,
      relationType: relationship.relationType as ReasoningOntologyRelationType,
      rationale: relationship.rationale,
      evidence: relationship.evidence,
    })),
  ])

  const bridgeQuestions = await prisma.reasoningOntologyOutcome.findMany({
    where: {
      reviewState: "approved",
      OR: terms.map((term) => ({ summary: { contains: term, mode: "insensitive" as const } })),
    },
    take: 4,
    select: { summary: true, missingAreas: true },
  })

  return {
    enabled: true,
    concepts: concepts.map((concept) => ({
      id: concept.id,
      label: concept.canonicalLabel,
      description: concept.description,
      aliases: concept.aliases,
      evidence: concept.evidence,
    })),
    relationships: dedupeRelationships(relationships).slice(0, 10),
    bridgeQuestions: bridgeQuestions.flatMap((item) => [
      ...(item.summary ? [item.summary] : []),
      ...item.missingAreas.map((area) => `Missing/underconnected area: ${area}`),
    ]).slice(0, 6),
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

function extractOntologySearchTerms(query: string) {
  return Array.from(new Set(query
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

const ONTOLOGY_STOPWORDS = new Set(["about", "after", "again", "being", "could", "every", "their", "there", "these", "those", "where", "which", "while", "would"])
