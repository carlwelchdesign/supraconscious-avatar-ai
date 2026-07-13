"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { Prisma } from "@prisma/client"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const PromoteSchema = z.object({
  targetType: z.enum(["concept", "relationship", "cluster", "outcome"]),
  targetId: z.string().trim().min(1),
  reason: z.string().trim().min(10),
})

const RelationshipTypes = ["causal", "hierarchical", "associative", "tension", "practice_to_outcome", "supports", "gap_bridge"] as const

const BridgeSchema = z.object({
  fromConceptId: z.string().trim().min(1),
  toConceptId: z.string().trim().min(1),
  relationType: z.enum(RelationshipTypes).default("gap_bridge"),
  rationale: z.string().trim().min(10),
  reason: z.string().trim().min(10),
})

export async function promoteReasoningOntologyCandidateAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = PromoteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/reasoning-ontology?status=invalid")

  if (parsed.data.targetType === "concept") {
    await promoteConcept(parsed.data.targetId, actor.id, parsed.data.reason)
  } else if (parsed.data.targetType === "relationship") {
    await promoteRelationship(parsed.data.targetId, actor.id, parsed.data.reason)
  } else if (parsed.data.targetType === "cluster") {
    await promoteCluster(parsed.data.targetId, actor.id, parsed.data.reason)
  } else {
    await promoteOutcome(parsed.data.targetId, actor.id, parsed.data.reason)
  }

  revalidatePath("/reasoning-ontology")
  redirect("/reasoning-ontology?status=promoted")
}

export async function createReasoningOntologyBridgeAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = BridgeSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/reasoning-ontology?status=invalid")

  const [fromConcept, toConcept] = await Promise.all([
    prisma.reasoningOntologyConcept.findUnique({ where: { id: parsed.data.fromConceptId }, select: { id: true, conceptKey: true } }),
    prisma.reasoningOntologyConcept.findUnique({ where: { id: parsed.data.toConceptId }, select: { id: true, conceptKey: true } }),
  ])
  if (!fromConcept || !toConcept || fromConcept.id === toConcept.id) redirect("/reasoning-ontology?status=invalid")

  const relationshipKey = relationshipKeyFor(fromConcept.conceptKey, toConcept.conceptKey, parsed.data.relationType)
  await prisma.reasoningOntologyRelationship.upsert({
    where: { relationshipKey },
    create: {
      relationshipKey,
      fromConceptId: fromConcept.id,
      toConceptId: toConcept.id,
      relationType: parsed.data.relationType,
      rationale: parsed.data.rationale,
      confidence: 0.6,
      reviewState: "approved",
      createdById: actor.id,
      metadata: { createdFrom: "manual_bridge" },
    },
    update: {
      rationale: parsed.data.rationale,
      relationType: parsed.data.relationType,
      reviewState: "approved",
      updatedAt: new Date(),
    },
  })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "reasoning_ontology.bridge_create",
      targetType: "ReasoningOntologyRelationship",
      targetId: relationshipKey,
      reason: parsed.data.reason,
      metadata: {
        fromConceptId: fromConcept.id,
        toConceptId: toConcept.id,
        relationType: parsed.data.relationType,
      },
    },
  })

  revalidatePath("/reasoning-ontology")
  redirect("/reasoning-ontology?status=bridge_created")
}

async function promoteConcept(nodeId: string, actorId: string, reason: string) {
  const node = await prisma.reasoningGraphNode.findUnique({
    where: { id: nodeId },
    include: { evidence: true },
  })
  if (!node) redirect("/reasoning-ontology?status=invalid")

  const concept = await prisma.reasoningOntologyConcept.upsert({
    where: { conceptKey: node.nodeKey },
    create: {
      conceptKey: node.nodeKey,
      canonicalLabel: node.label,
      aliases: [],
      description: node.summary,
      reviewState: "approved",
      sourceGraphNodeId: node.id,
      createdById: actorId,
      metadata: jsonInput(node.metadata),
    },
    update: {
      canonicalLabel: node.label,
      description: node.summary,
      reviewState: "approved",
      sourceGraphNodeId: node.id,
      updatedAt: new Date(),
    },
  })
  await copyEvidence({ conceptId: concept.id }, node.evidence)
  await writeAudit(actorId, "reasoning_ontology.concept_promote", "ReasoningOntologyConcept", concept.id, reason, { graphNodeId: node.id })
}

async function promoteRelationship(edgeId: string, actorId: string, reason: string) {
  const edge = await prisma.reasoningGraphEdge.findUnique({
    where: { id: edgeId },
    include: {
      fromNode: { include: { evidence: true } },
      toNode: { include: { evidence: true } },
      evidence: true,
    },
  })
  if (!edge) redirect("/reasoning-ontology?status=invalid")

  const [fromConcept, toConcept] = await Promise.all([
    ensureConceptFromNode(edge.fromNode, actorId),
    ensureConceptFromNode(edge.toNode, actorId),
  ])
  const relationType = normalizeRelationType(edge.relationType)
  const relationshipKey = relationshipKeyFor(fromConcept.conceptKey, toConcept.conceptKey, relationType)
  const relationship = await prisma.reasoningOntologyRelationship.upsert({
    where: { relationshipKey },
    create: {
      relationshipKey,
      fromConceptId: fromConcept.id,
      toConceptId: toConcept.id,
      relationType,
      rationale: edge.rationale,
      confidence: edge.confidence,
      reviewState: "approved",
      sourceGraphEdgeId: edge.id,
      createdById: actorId,
      metadata: jsonInput(edge.metadata),
    },
    update: {
      relationType,
      rationale: edge.rationale,
      confidence: edge.confidence,
      reviewState: "approved",
      sourceGraphEdgeId: edge.id,
      updatedAt: new Date(),
    },
  })
  await copyEvidence({ relationshipId: relationship.id }, edge.evidence)
  await writeAudit(actorId, "reasoning_ontology.relationship_promote", "ReasoningOntologyRelationship", relationship.id, reason, { graphEdgeId: edge.id })
}

async function promoteCluster(clusterId: string, actorId: string, reason: string) {
  const cluster = await prisma.reasoningGraphCluster.findUnique({
    where: { id: clusterId },
    include: { nodes: { include: { evidence: true } } },
  })
  if (!cluster) redirect("/reasoning-ontology?status=invalid")

  const ontologyCluster = await prisma.reasoningOntologyCluster.upsert({
    where: { clusterKey: `graph-cluster-${cluster.runId}-${cluster.clusterKey}` },
    create: {
      clusterKey: `graph-cluster-${cluster.runId}-${cluster.clusterKey}`,
      label: cluster.label,
      summary: cluster.summary,
      reviewState: "approved",
      sourceGraphClusterId: cluster.id,
      createdById: actorId,
      metadata: jsonInput(cluster.metrics),
    },
    update: {
      label: cluster.label,
      summary: cluster.summary,
      reviewState: "approved",
      sourceGraphClusterId: cluster.id,
      updatedAt: new Date(),
    },
  })

  for (const node of cluster.nodes.slice(0, 12)) {
    const concept = await ensureConceptFromNode(node, actorId)
    await prisma.reasoningOntologyClusterConcept.upsert({
      where: { clusterId_conceptId: { clusterId: ontologyCluster.id, conceptId: concept.id } },
      create: { clusterId: ontologyCluster.id, conceptId: concept.id, weight: node.weightedDegree || 1 },
      update: { weight: node.weightedDegree || 1 },
    })
  }
  await writeAudit(actorId, "reasoning_ontology.cluster_promote", "ReasoningOntologyCluster", ontologyCluster.id, reason, { graphClusterId: cluster.id })
}

async function promoteOutcome(insightId: string, actorId: string, reason: string) {
  const insight = await prisma.reasoningGraphInsight.findUnique({
    where: { id: insightId },
    include: { evidence: true },
  })
  if (!insight) redirect("/reasoning-ontology?status=invalid")

  const outcome = await prisma.reasoningOntologyOutcome.upsert({
    where: { outcomeKey: `graph-insight-${insight.id}` },
    create: {
      outcomeKey: `graph-insight-${insight.id}`,
      label: insight.title,
      summary: insight.summary,
      missingAreas: readMissingAreas(insight.metadata),
      reviewState: "approved",
      sourceGraphInsightId: insight.id,
      createdById: actorId,
      metadata: jsonInput(insight.metadata),
    },
    update: {
      label: insight.title,
      summary: insight.summary,
      missingAreas: readMissingAreas(insight.metadata),
      reviewState: "approved",
      sourceGraphInsightId: insight.id,
      updatedAt: new Date(),
    },
  })
  await copyEvidence({ outcomeId: outcome.id }, insight.evidence)
  await writeAudit(actorId, "reasoning_ontology.outcome_promote", "ReasoningOntologyOutcome", outcome.id, reason, { graphInsightId: insight.id })
}

async function ensureConceptFromNode(node: {
  id: string
  nodeKey: string
  label: string
  summary: string | null
  metadata: unknown
  evidence: Array<{ sourceDocumentId: string | null; sourceChunkId: string | null; evidenceKind: string; excerpt: string | null; weight: number; metadata: unknown }>
}, actorId: string) {
  const concept = await prisma.reasoningOntologyConcept.upsert({
    where: { conceptKey: node.nodeKey },
    create: {
      conceptKey: node.nodeKey,
      canonicalLabel: node.label,
      description: node.summary,
      reviewState: "approved",
      sourceGraphNodeId: node.id,
      createdById: actorId,
      metadata: jsonInput(node.metadata),
    },
    update: {
      canonicalLabel: node.label,
      description: node.summary,
      reviewState: "approved",
      sourceGraphNodeId: node.id,
      updatedAt: new Date(),
    },
  })
  await copyEvidence({ conceptId: concept.id }, node.evidence)
  return concept
}

async function copyEvidence(
  target: { conceptId?: string; relationshipId?: string; clusterId?: string; outcomeId?: string },
  evidence: Array<{ sourceDocumentId: string | null; sourceChunkId: string | null; evidenceKind: string; excerpt: string | null; weight: number; metadata: unknown }>,
) {
  if (evidence.length === 0) return
  await prisma.reasoningOntologyEvidence.createMany({
    data: evidence.slice(0, 8).map((item) => ({
      ...target,
      sourceDocumentId: item.sourceDocumentId,
      sourceChunkId: item.sourceChunkId,
      evidenceKind: item.evidenceKind,
      excerpt: item.excerpt,
      weight: item.weight,
      metadata: jsonInput(item.metadata),
    })),
    skipDuplicates: true,
  })
}

function normalizeRelationType(value: string) {
  return RelationshipTypes.includes(value as typeof RelationshipTypes[number])
    ? value
    : "associative"
}

function relationshipKeyFor(fromKey: string, toKey: string, relationType: string) {
  return `${fromKey}__${relationType}__${toKey}`
}

function readMissingAreas(metadata: unknown) {
  if (!metadata || typeof metadata !== "object" || !("proposedBridgeConcepts" in metadata)) return []
  const value = (metadata as { proposedBridgeConcepts?: unknown }).proposedBridgeConcepts
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []
}

async function writeAudit(actorId: string, action: string, targetType: string, targetId: string, reason: string, metadata: Record<string, unknown>) {
  await prisma.auditLog.create({
    data: { actorId, action, targetType, targetId, reason, metadata: jsonInput(metadata) },
  })
}

function jsonInput(value: unknown): Prisma.InputJsonValue | undefined {
  return value === null || value === undefined ? undefined : value as Prisma.InputJsonValue
}
