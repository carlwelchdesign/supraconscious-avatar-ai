"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import {
  REASONING_GRAPH_PROMPT_VERSION,
  buildApprovedDocumentWhere,
  buildReasoningGraphFromChunks,
  generateReasoningGraphAiInsights,
} from "@inner-avatar/ai"
import { requireAdminUser } from "@inner-avatar/auth/session"
import { prisma } from "@inner-avatar/db"

const GenerateGraphSchema = z.object({
  sourceType: z.string().trim().default("all"),
  maxChunks: z.coerce.number().int().min(10).max(500).default(180),
  reason: z.string().trim().min(10, "A generation reason is required."),
})

const ReviewSchema = z.object({
  targetType: z.enum(["node", "edge", "insight"]),
  targetId: z.string().trim().min(1),
  reviewState: z.enum(["unreviewed", "approved", "rejected", "needs_revision"]),
  reason: z.string().trim().min(10, "A review reason is required."),
})

export async function generateReasoningGraphAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = GenerateGraphSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/reasoning-graph?status=invalid")

  const sourceType = parsed.data.sourceType === "all" ? undefined : parsed.data.sourceType
  const chunks = await prisma.sourceChunk.findMany({
    where: {
      reviewState: { in: ["approved", "approved_curriculum"] },
      safetyIntensity: { not: "blocked" },
      sourceDocument: {
        ...buildApprovedDocumentWhere(),
        ...(sourceType ? { sourceType } : {}),
      },
    },
    orderBy: [{ sourcePriority: "desc" }, { createdAt: "asc" }],
    take: parsed.data.maxChunks,
    select: {
      id: true,
      sourceDocumentId: true,
      chunkText: true,
      quoteSafeExcerpt: true,
      conceptTags: true,
      sourceDocument: { select: { title: true } },
    },
  })

  if (chunks.length === 0) redirect("/reasoning-graph?status=no_sources")

  try {
    const graph = buildReasoningGraphFromChunks(chunks.map((chunk) => ({
      id: chunk.id,
      sourceDocumentId: chunk.sourceDocumentId,
      title: chunk.sourceDocument.title,
      text: chunk.chunkText,
      conceptTags: chunk.conceptTags,
    })), { maxNodes: 72, maxEdges: 360, conceptsPerChunk: 8 })
    const aiInsightResult = await generateReasoningGraphAiInsights(graph).catch((error) => ({
      status: "unavailable" as const,
      insights: [],
      errorMessage: error instanceof Error ? error.message : "AI insight generation failed.",
    }))
    const insights = [...graph.insights, ...aiInsightResult.insights]

    await prisma.$transaction(async (tx) => {
      const run = await tx.reasoningGraphRun.create({
        data: {
          createdById: actor.id,
          status: "completed",
          sourceScope: sourceType ?? "approved_sources",
          sourceDocumentIds: graph.sourceDocumentIds,
          model: null,
          promptVersion: REASONING_GRAPH_PROMPT_VERSION,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          clusterCount: graph.clusters.length,
          insightCount: insights.length,
          metadata: {
            ...graph.metadata,
            aiInsightStatus: aiInsightResult.status,
            aiInsightError: "errorMessage" in aiInsightResult ? aiInsightResult.errorMessage : undefined,
          },
          completedAt: new Date(),
        },
      })

      const clusterIds = new Map<number, string>()
      for (const cluster of graph.clusters) {
        const saved = await tx.reasoningGraphCluster.create({
          data: {
            runId: run.id,
            clusterKey: cluster.key,
            label: cluster.label,
            summary: cluster.summary,
            size: cluster.size,
            metrics: { centralNodeKeys: cluster.centralNodeKeys, nodeKeys: cluster.nodeKeys },
          },
          select: { id: true },
        })
        clusterIds.set(cluster.key, saved.id)
      }

      const nodeIds = new Map<string, string>()
      for (const node of graph.nodes) {
        const saved = await tx.reasoningGraphNode.create({
          data: {
            runId: run.id,
            clusterId: clusterIds.get(node.clusterKey),
            nodeKey: node.key,
            nodeType: node.nodeType,
            label: node.label,
            normalizedLabel: node.normalizedLabel,
            summary: node.summary,
            degree: node.degree,
            weightedDegree: node.weightedDegree,
            betweenness: node.betweenness,
            bridgeScore: node.bridgeScore,
            metadata: {
              sourceChunkIds: node.sourceChunkIds,
              sourceDocumentIds: node.sourceDocumentIds,
            },
          },
          select: { id: true },
        })
        nodeIds.set(node.key, saved.id)
        await tx.reasoningGraphEvidence.createMany({
          data: node.sourceChunkIds.slice(0, 8).map((sourceChunkId) => {
            const chunk = chunks.find((item) => item.id === sourceChunkId)
            return {
              runId: run.id,
              nodeId: saved.id,
              sourceDocumentId: chunk?.sourceDocumentId,
              sourceChunkId,
              evidenceKind: "node_source",
              excerpt: readExcerpt(chunk),
            }
          }),
        })
      }

      const edgeIds = new Map<string, string>()
      for (const edge of graph.edges) {
        const fromNodeId = nodeIds.get(edge.fromKey)
        const toNodeId = nodeIds.get(edge.toKey)
        if (!fromNodeId || !toNodeId) continue
        const saved = await tx.reasoningGraphEdge.create({
          data: {
            runId: run.id,
            fromNodeId,
            toNodeId,
            edgeKey: edge.key,
            relationType: edge.relationType,
            weight: edge.weight,
            confidence: edge.confidence,
            rationale: edge.rationale,
            metadata: {
              sourceChunkIds: edge.sourceChunkIds,
              sourceDocumentIds: edge.sourceDocumentIds,
            },
          },
          select: { id: true },
        })
        edgeIds.set(edge.key, saved.id)
        await tx.reasoningGraphEvidence.createMany({
          data: edge.sourceChunkIds.slice(0, 6).map((sourceChunkId) => {
            const chunk = chunks.find((item) => item.id === sourceChunkId)
            return {
              runId: run.id,
              edgeId: saved.id,
              sourceDocumentId: chunk?.sourceDocumentId,
              sourceChunkId,
              evidenceKind: "edge_source",
              excerpt: readExcerpt(chunk),
            }
          }),
        })
      }

      for (const insight of insights) {
        const insightNodeIds = insight.nodeKeys.flatMap((key) => {
          const id = nodeIds.get(key)
          return id ? [id] : []
        })
        const insightEdgeIds = insight.edgeKeys.flatMap((key) => {
          const id = edgeIds.get(key)
          return id ? [id] : []
        })
        const saved = await tx.reasoningGraphInsight.create({
          data: {
            runId: run.id,
            insightType: insight.insightType,
            title: insight.title,
            summary: insight.summary,
            confidence: insight.confidence,
            nodeIds: insightNodeIds,
            edgeIds: insightEdgeIds,
            metadata: {
              nodeKeys: insight.nodeKeys,
              edgeKeys: insight.edgeKeys,
              sourceChunkIds: insight.sourceChunkIds,
            },
          },
          select: { id: true },
        })
        await tx.reasoningGraphEvidence.createMany({
          data: insight.sourceChunkIds.slice(0, 8).map((sourceChunkId) => {
            const chunk = chunks.find((item) => item.id === sourceChunkId)
            return {
              runId: run.id,
              insightId: saved.id,
              sourceDocumentId: chunk?.sourceDocumentId,
              sourceChunkId,
              evidenceKind: "insight_source",
              excerpt: readExcerpt(chunk),
            }
          }),
        })
      }

      await tx.auditLog.create({
        data: {
          actorId: actor.id,
          action: "reasoning_graph.generate",
          targetType: "ReasoningGraphRun",
          targetId: run.id,
          reason: parsed.data.reason,
          metadata: {
            sourceType: sourceType ?? "all",
            chunkCount: chunks.length,
            nodeCount: graph.nodes.length,
            edgeCount: graph.edges.length,
            clusterCount: graph.clusters.length,
            insightCount: insights.length,
            aiInsightStatus: aiInsightResult.status,
          },
        },
      })
    }, { timeout: 120_000, maxWait: 10_000 })
  } catch (error) {
    await prisma.reasoningGraphRun.create({
      data: {
        createdById: actor.id,
        status: "failed",
        sourceScope: sourceType ?? "approved_sources",
        sourceDocumentIds: Array.from(new Set(chunks.map((chunk) => chunk.sourceDocumentId))),
        promptVersion: REASONING_GRAPH_PROMPT_VERSION,
        errorMessage: error instanceof Error ? error.message : "Unknown reasoning graph generation error.",
        metadata: { chunkCount: chunks.length },
        completedAt: new Date(),
      },
    })
    redirect("/reasoning-graph?status=failed")
  }

  revalidatePath("/reasoning-graph")
  redirect("/reasoning-graph?status=generated")
}

export async function reviewReasoningGraphItemAction(formData: FormData) {
  const actor = await requireAdminUser()
  const parsed = ReviewSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) redirect("/reasoning-graph?status=review_invalid")

  const target = parsed.data.targetType === "node"
    ? await prisma.reasoningGraphNode.update({ where: { id: parsed.data.targetId }, data: { reviewState: parsed.data.reviewState }, select: { id: true, runId: true } })
    : parsed.data.targetType === "edge"
      ? await prisma.reasoningGraphEdge.update({ where: { id: parsed.data.targetId }, data: { reviewState: parsed.data.reviewState }, select: { id: true, runId: true } })
      : await prisma.reasoningGraphInsight.update({ where: { id: parsed.data.targetId }, data: { reviewState: parsed.data.reviewState }, select: { id: true, runId: true } })

  await prisma.auditLog.create({
    data: {
      actorId: actor.id,
      action: "reasoning_graph.review",
      targetType: `ReasoningGraph${parsed.data.targetType}`,
      targetId: target.id,
      reason: parsed.data.reason,
      metadata: {
        runId: target.runId,
        reviewState: parsed.data.reviewState,
      },
    },
  })

  revalidatePath("/reasoning-graph")
  redirect("/reasoning-graph?status=review_saved")
}

function readExcerpt(chunk: { quoteSafeExcerpt: string | null; chunkText: string } | undefined) {
  if (!chunk) return null
  return chunk.quoteSafeExcerpt ?? `${chunk.chunkText.slice(0, 260)}${chunk.chunkText.length > 260 ? "..." : ""}`
}
