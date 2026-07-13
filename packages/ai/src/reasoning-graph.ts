import { zodTextFormat } from "openai/helpers/zod"
import { z } from "zod"
import { getOpenAIClient, isOpenAIConfigured, reflectiveModel } from "./openai.js"

export const REASONING_GRAPH_PROMPT_VERSION = "reasoning-graph-v1"

export type ReasoningGraphSourceChunk = {
  id: string
  sourceDocumentId: string
  title: string
  text: string
  conceptTags?: unknown
}

export type BuiltReasoningGraphNode = {
  key: string
  label: string
  normalizedLabel: string
  nodeType: "concept"
  clusterKey: number
  degree: number
  weightedDegree: number
  betweenness: number
  bridgeScore: number
  sourceChunkIds: string[]
  sourceDocumentIds: string[]
  summary: string
}

export type BuiltReasoningGraphEdge = {
  key: string
  fromKey: string
  toKey: string
  relationType: "co_occurs"
  weight: number
  confidence: number
  rationale: string
  sourceChunkIds: string[]
  sourceDocumentIds: string[]
}

export type BuiltReasoningGraphCluster = {
  key: number
  label: string
  summary: string
  nodeKeys: string[]
  size: number
  centralNodeKeys: string[]
}

export type BuiltReasoningGraphInsight = {
  insightType: "cluster_summary" | "bridge_concept" | "structural_gap" | "stakeholder_path"
  title: string
  summary: string
  confidence: number
  nodeKeys: string[]
  edgeKeys: string[]
  sourceChunkIds: string[]
}

export type BuiltReasoningGraph = {
  nodes: BuiltReasoningGraphNode[]
  edges: BuiltReasoningGraphEdge[]
  clusters: BuiltReasoningGraphCluster[]
  insights: BuiltReasoningGraphInsight[]
  sourceDocumentIds: string[]
  sourceChunkIds: string[]
  metadata: {
    promptVersion: string
    chunkCount: number
    generatedBy: "deterministic"
  }
}

export const ReasoningGraphAiInsightSchema = z.object({
  insightType: z.enum(["cluster_summary", "bridge_concept", "structural_gap", "stakeholder_path"]),
  title: z.string().trim().min(3).max(160),
  summary: z.string().trim().min(10).max(1200),
  confidence: z.number().min(0).max(1),
  nodeKeys: z.array(z.string().trim().min(1)).min(1),
  edgeKeys: z.array(z.string().trim().min(1)).default([]),
  sourceChunkIds: z.array(z.string().trim().min(1)).min(1),
})

export const ReasoningGraphAiInsightListSchema = z.object({
  insights: z.array(ReasoningGraphAiInsightSchema).max(24),
})

export async function generateReasoningGraphAiInsights(graph: BuiltReasoningGraph): Promise<{
  status: "generated" | "unavailable"
  insights: BuiltReasoningGraphInsight[]
}> {
  if (!isOpenAIConfigured()) {
    return { status: "unavailable", insights: [] }
  }

  const response = await getOpenAIClient().responses.parse({
    model: reflectiveModel,
    input: [
      {
        role: "system",
        content: `Analyze this source-backed reasoning graph.
Return concise admin-only insights that help validate what the corpus supports.
Do not invent claims outside the provided graph.
Every insight must cite existing sourceChunkIds and existing nodeKeys.
Focus on clusters, bridge concepts, structural gaps, and stakeholder paths.`,
      },
      {
        role: "user",
        content: JSON.stringify({
          nodes: graph.nodes.slice(0, 60).map((node) => ({
            key: node.key,
            label: node.label,
            clusterKey: node.clusterKey,
            weightedDegree: node.weightedDegree,
            betweenness: node.betweenness,
            bridgeScore: node.bridgeScore,
            sourceChunkIds: node.sourceChunkIds.slice(0, 6),
          })),
          edges: graph.edges.slice(0, 120).map((edge) => ({
            key: edge.key,
            fromKey: edge.fromKey,
            toKey: edge.toKey,
            weight: edge.weight,
            sourceChunkIds: edge.sourceChunkIds.slice(0, 6),
          })),
          clusters: graph.clusters,
        }),
      },
    ],
    text: {
      format: zodTextFormat(ReasoningGraphAiInsightListSchema, "reasoning_graph_insights"),
    },
  })

  if (!response.output_parsed) {
    throw new Error("Reasoning graph insight generator returned no structured output.")
  }

  return {
    status: "generated",
    insights: validateReasoningGraphAiInsights(response.output_parsed, graph),
  }
}

export function buildReasoningGraphFromChunks(
  chunks: ReasoningGraphSourceChunk[],
  options: { maxNodes?: number; maxEdges?: number; conceptsPerChunk?: number } = {},
): BuiltReasoningGraph {
  const maxNodes = options.maxNodes ?? 80
  const maxEdges = options.maxEdges ?? 420
  const conceptsPerChunk = options.conceptsPerChunk ?? 10
  const chunkConcepts = chunks.map((chunk) => ({
    chunk,
    concepts: extractChunkConcepts(chunk, conceptsPerChunk),
  }))
  const frequencies = new Map<string, { label: string; count: number }>()

  for (const item of chunkConcepts) {
    for (const concept of item.concepts) {
      const key = conceptKey(concept)
      const existing = frequencies.get(key)
      frequencies.set(key, { label: existing?.label ?? concept, count: (existing?.count ?? 0) + 1 })
    }
  }

  const allowedKeys = new Set(
    Array.from(frequencies.entries())
      .sort((left, right) => right[1].count - left[1].count || left[0].localeCompare(right[0]))
      .slice(0, maxNodes)
      .map(([key]) => key),
  )
  const nodeSources = new Map<string, { label: string; chunkIds: Set<string>; documentIds: Set<string> }>()
  const edges = new Map<string, BuiltReasoningGraphEdge>()

  for (const item of chunkConcepts) {
    const keys = Array.from(new Set(item.concepts.map(conceptKey).filter((key) => allowedKeys.has(key)))).sort()
    for (const key of keys) {
      const source = nodeSources.get(key) ?? {
        label: frequencies.get(key)?.label ?? key,
        chunkIds: new Set<string>(),
        documentIds: new Set<string>(),
      }
      source.chunkIds.add(item.chunk.id)
      source.documentIds.add(item.chunk.sourceDocumentId)
      nodeSources.set(key, source)
    }
    for (let leftIndex = 0; leftIndex < keys.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < keys.length; rightIndex += 1) {
        const fromKey = keys[leftIndex]
        const toKey = keys[rightIndex]
        const key = `${fromKey}__${toKey}`
        const existing = edges.get(key)
        const chunkIds = new Set(existing?.sourceChunkIds ?? [])
        const documentIds = new Set(existing?.sourceDocumentIds ?? [])
        chunkIds.add(item.chunk.id)
        documentIds.add(item.chunk.sourceDocumentId)
        edges.set(key, {
          key,
          fromKey,
          toKey,
          relationType: "co_occurs",
          weight: (existing?.weight ?? 0) + 1,
          confidence: clamp(0.35 + ((existing?.weight ?? 0) + 1) * 0.08, 0.35, 0.92),
          rationale: "Concepts recur within the same approved source chunk window.",
          sourceChunkIds: Array.from(chunkIds),
          sourceDocumentIds: Array.from(documentIds),
        })
      }
    }
  }

  const graphEdges = Array.from(edges.values())
    .sort((left, right) => right.weight - left.weight || right.confidence - left.confidence || left.key.localeCompare(right.key))
    .slice(0, maxEdges)
  const metrics = computeGraphMetrics(Array.from(nodeSources.keys()), graphEdges)
  const clusters = buildClusters(Array.from(nodeSources.keys()), graphEdges, nodeSources, metrics)
  const clusterByNode = new Map(clusters.flatMap((cluster) => cluster.nodeKeys.map((key) => [key, cluster.key] as const)))
  const nodes = Array.from(nodeSources.entries())
    .map(([key, source]) => {
      const metric = metrics.get(key) ?? { degree: 0, weightedDegree: 0, betweenness: 0 }
      return {
        key,
        label: source.label,
        normalizedLabel: key.replaceAll("-", " "),
        nodeType: "concept" as const,
        clusterKey: clusterByNode.get(key) ?? 0,
        degree: metric.degree,
        weightedDegree: metric.weightedDegree,
        betweenness: metric.betweenness,
        bridgeScore: Number((metric.betweenness + metric.weightedDegree * 0.05).toFixed(4)),
        sourceChunkIds: Array.from(source.chunkIds),
        sourceDocumentIds: Array.from(source.documentIds),
        summary: `Appears in ${source.chunkIds.size} approved source chunk${source.chunkIds.size === 1 ? "" : "s"}.`,
      }
    })
    .sort((left, right) => right.bridgeScore - left.bridgeScore || right.weightedDegree - left.weightedDegree || left.label.localeCompare(right.label))

  return {
    nodes,
    edges: graphEdges,
    clusters,
    insights: buildDeterministicInsights(nodes, Array.from(edges.values()), clusters),
    sourceDocumentIds: Array.from(new Set(chunks.map((chunk) => chunk.sourceDocumentId))),
    sourceChunkIds: chunks.map((chunk) => chunk.id),
    metadata: {
      promptVersion: REASONING_GRAPH_PROMPT_VERSION,
      chunkCount: chunks.length,
      generatedBy: "deterministic",
    },
  }
}

export function validateReasoningGraphAiInsights(input: unknown, graph: Pick<BuiltReasoningGraph, "nodes" | "edges" | "sourceChunkIds">) {
  const parsed = ReasoningGraphAiInsightListSchema.parse(input)
  const nodeKeys = new Set(graph.nodes.map((node) => node.key))
  const edgeKeys = new Set(graph.edges.map((edge) => edge.key))
  const sourceChunkIds = new Set(graph.sourceChunkIds)
  for (const insight of parsed.insights) {
    if (!insight.nodeKeys.every((key) => nodeKeys.has(key))) {
      throw new Error("Reasoning graph insight references an unknown node.")
    }
    if (!insight.edgeKeys.every((key) => edgeKeys.has(key))) {
      throw new Error("Reasoning graph insight references an unknown edge.")
    }
    if (!insight.sourceChunkIds.every((id) => sourceChunkIds.has(id))) {
      throw new Error("Reasoning graph insight references unknown source evidence.")
    }
  }
  return parsed.insights
}

export function extractChunkConcepts(chunk: ReasoningGraphSourceChunk, limit = 10) {
  const tagged = parseStringArray(chunk.conceptTags)
  const phrases = extractConceptPhrases(chunk.text)
  return Array.from(new Set([...tagged, ...phrases]))
    .filter(isReasoningGraphConceptAllowed)
    .slice(0, limit)
}

export function isReasoningGraphConceptAllowed(value: string) {
  const trimmed = value.trim()
  if (!trimmed) return false
  const normalized = trimmed.toLowerCase().replace(/\s+/g, " ")
  const tokenized = normalized.replace(/[^a-z0-9]+/g, " ").trim()
  const tokens = tokenized ? tokenized.split(/\s+/) : []

  if (EXCLUDED_CONCEPT_LABELS.has(normalized) || EXCLUDED_CONCEPT_LABELS.has(tokenized)) return false
  if (/\b[\w.%+-]+@[\w.-]+\.[a-z]{2,}\b/i.test(trimmed)) return false
  if (/\b\d{4}[-_/]\d{2}[-_/]\d{2}(?:t\d{2})?\b/i.test(trimmed)) return false
  if (/\b\d{4}\b.*\b(input|output|fixture|test|scenario)\b/i.test(normalized)) return false
  if (/\b(docx|pdf|png|jpeg|jpg|file|filename|path|fixture|test|example|email)\b/i.test(normalized)) return false
  if (tokens.length === 0 || tokens.some((token) => token.length > 32)) return false
  if (tokens.filter((token) => /^\d+$/.test(token)).length >= Math.max(1, Math.ceil(tokens.length / 2))) return false
  if (tokens.length === 1 && tokens[0].length < 4) return false
  return true
}

function extractConceptPhrases(text: string) {
  const words = text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 4 && !STOPWORDS.has(word))
  const counts = new Map<string, number>()
  for (let index = 0; index < words.length; index += 1) {
    for (const size of [1, 2, 3]) {
      const phrase = words.slice(index, index + size)
      if (phrase.length !== size) continue
      if (phrase.some((word) => STOPWORDS.has(word))) continue
      const value = phrase.join(" ")
      counts.set(value, (counts.get(value) ?? 0) + (size === 1 ? 1 : size + 1))
    }
  }
  return Array.from(counts.entries())
    .filter(([phrase, count]) => count > 1 || phrase.includes(" "))
    .sort((left, right) => right[1] - left[1] || right[0].split(" ").length - left[0].split(" ").length || left[0].localeCompare(right[0]))
    .map(([phrase]) => titleCase(phrase))
    .slice(0, 18)
}

function computeGraphMetrics(nodeKeys: string[], edges: BuiltReasoningGraphEdge[]) {
  const metrics = new Map(nodeKeys.map((key) => [key, { degree: 0, weightedDegree: 0, betweenness: 0 }]))
  const adjacency = new Map(nodeKeys.map((key) => [key, new Set<string>()]))
  for (const edge of edges) {
    const left = metrics.get(edge.fromKey)
    const right = metrics.get(edge.toKey)
    if (!left || !right) continue
    left.degree += 1
    right.degree += 1
    left.weightedDegree += edge.weight
    right.weightedDegree += edge.weight
    adjacency.get(edge.fromKey)?.add(edge.toKey)
    adjacency.get(edge.toKey)?.add(edge.fromKey)
  }
  for (const source of nodeKeys) {
    const paths = shortestPaths(source, adjacency)
    for (const [target, path] of paths) {
      if (target === source || path.length < 3) continue
      for (const middle of path.slice(1, -1)) {
        const metric = metrics.get(middle)
        if (metric) metric.betweenness += 1
      }
    }
  }
  const normalizer = Math.max(1, (nodeKeys.length - 1) * (nodeKeys.length - 2))
  for (const metric of metrics.values()) {
    metric.betweenness = Number((metric.betweenness / normalizer).toFixed(4))
    metric.weightedDegree = Number(metric.weightedDegree.toFixed(2))
  }
  return metrics
}

function shortestPaths(source: string, adjacency: Map<string, Set<string>>) {
  const paths = new Map<string, string[]>()
  const queue = [source]
  paths.set(source, [source])
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index]
    for (const next of adjacency.get(current) ?? []) {
      if (paths.has(next)) continue
      paths.set(next, [...(paths.get(current) ?? []), next])
      queue.push(next)
    }
  }
  return paths
}

function buildClusters(
  nodeKeys: string[],
  edges: BuiltReasoningGraphEdge[],
  nodeSources: Map<string, { label: string }>,
  metrics: Map<string, { weightedDegree: number }>,
) {
  const adjacency = new Map(nodeKeys.map((key) => [key, new Set<string>()]))
  for (const edge of edges) {
    adjacency.get(edge.fromKey)?.add(edge.toKey)
    adjacency.get(edge.toKey)?.add(edge.fromKey)
  }
  const seen = new Set<string>()
  const clusters: BuiltReasoningGraphCluster[] = []
  for (const nodeKey of nodeKeys) {
    if (seen.has(nodeKey)) continue
    const queue = [nodeKey]
    const component: string[] = []
    seen.add(nodeKey)
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index]
      component.push(current)
      for (const next of adjacency.get(current) ?? []) {
        if (seen.has(next)) continue
        seen.add(next)
        queue.push(next)
      }
    }
    const central = component
      .sort((left, right) => (metrics.get(right)?.weightedDegree ?? 0) - (metrics.get(left)?.weightedDegree ?? 0) || left.localeCompare(right))
      .slice(0, 4)
    clusters.push({
      key: clusters.length,
      label: central.map((key) => nodeSources.get(key)?.label ?? key).slice(0, 2).join(" / ") || "Unlabeled cluster",
      summary: `A source-backed cluster centered on ${central.map((key) => nodeSources.get(key)?.label ?? key).slice(0, 3).join(", ")}.`,
      nodeKeys: component,
      size: component.length,
      centralNodeKeys: central,
    })
  }
  return clusters.sort((left, right) => right.size - left.size || left.key - right.key).map((cluster, index) => ({ ...cluster, key: index }))
}

function buildDeterministicInsights(
  nodes: BuiltReasoningGraphNode[],
  edges: BuiltReasoningGraphEdge[],
  clusters: BuiltReasoningGraphCluster[],
): BuiltReasoningGraphInsight[] {
  const edgeKeys = new Set(edges.map((edge) => `${edge.fromKey}:${edge.toKey}`))
  const insights: BuiltReasoningGraphInsight[] = clusters.slice(0, 6).map((cluster) => ({
    insightType: "cluster_summary",
    title: `Cluster: ${cluster.label}`,
    summary: cluster.summary,
    confidence: 0.74,
    nodeKeys: cluster.centralNodeKeys,
    edgeKeys: edges.filter((edge) => cluster.nodeKeys.includes(edge.fromKey) && cluster.nodeKeys.includes(edge.toKey)).slice(0, 6).map((edge) => edge.key),
    sourceChunkIds: nodes.filter((node) => cluster.centralNodeKeys.includes(node.key)).flatMap((node) => node.sourceChunkIds).slice(0, 8),
  }))
  for (const node of nodes.filter((item) => item.bridgeScore > 0).slice(0, 5)) {
    insights.push({
      insightType: "bridge_concept",
      title: `Bridge concept: ${node.label}`,
      summary: `${node.label} connects multiple source-backed idea paths and may be useful for reasoning across the corpus.`,
      confidence: 0.68,
      nodeKeys: [node.key],
      edgeKeys: edges.filter((edge) => edge.fromKey === node.key || edge.toKey === node.key).slice(0, 6).map((edge) => edge.key),
      sourceChunkIds: node.sourceChunkIds.slice(0, 8),
    })
  }
  const centralByCluster = clusters.flatMap((cluster) => cluster.centralNodeKeys.slice(0, 2))
  for (let index = 0; index < centralByCluster.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < centralByCluster.length; nextIndex += 1) {
      const left = nodes.find((node) => node.key === centralByCluster[index])
      const right = nodes.find((node) => node.key === centralByCluster[nextIndex])
      if (!left || !right || left.clusterKey === right.clusterKey) continue
      if (edgeKeys.has(`${left.key}:${right.key}`) || edgeKeys.has(`${right.key}:${left.key}`)) continue
      insights.push({
        insightType: "structural_gap",
        title: `Gap: ${left.label} ↔ ${right.label}`,
        summary: `These central concepts sit in separate clusters. Ask what connects ${left.label} to ${right.label}, and what stakeholder outcome might depend on that bridge.`,
        confidence: 0.58,
        nodeKeys: [left.key, right.key],
        edgeKeys: [],
        sourceChunkIds: [...left.sourceChunkIds, ...right.sourceChunkIds].slice(0, 8),
      })
      if (insights.filter((insight) => insight.insightType === "structural_gap").length >= 6) return insights
    }
  }
  return insights
}

function conceptKey(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80)
}

function parseStringArray(value: unknown) {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === "string").map(titleCase)
}

function titleCase(value: string) {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word ? `${word[0].toUpperCase()}${word.slice(1)}` : word)
    .join(" ")
}

function clamp(value: number, min: number, max: number) {
  return Number(Math.min(max, Math.max(min, value)).toFixed(2))
}

const STOPWORDS = new Set([
  "about", "above", "after", "again", "against", "being", "because", "before", "between", "could", "does", "doing",
  "each", "from", "have", "into", "itself", "just", "more", "most", "other", "over", "same", "should", "than",
  "that", "their", "them", "then", "there", "these", "they", "this", "those", "through", "under", "until", "very",
  "what", "when", "where", "which", "while", "with", "would", "your", "youre", "will", "only", "also", "often",
  "like", "such", "must", "within", "without", "toward", "towards", "inner", "council",
])

const EXCLUDED_CONCEPT_LABELS = new Set([
  "admin",
  "administrator",
  "carl",
  "carl welch",
  "founder",
  "founder calibration",
  "maria",
  "maria olon tsaroucha",
  "reviewer",
  "super admin",
  "user",
])
