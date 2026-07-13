"use client"

import { useMemo, useState } from "react"

export type ReasoningGraphViewData = {
  nodes: Array<{
    id: string
    key: string
    label: string
    clusterKey: number | null
    degree: number
    weightedDegree: number
    betweenness: number
    bridgeScore: number
    reviewState: string
    evidence: Array<{ excerpt: string | null; sourceTitle: string | null }>
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
}

export function ReasoningGraphView({ graph }: { graph: ReasoningGraphViewData }) {
  const [selectedNodeId, setSelectedNodeId] = useState(graph.nodes[0]?.id ?? "")
  const layout = useMemo(() => buildLayout(graph), [graph])
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0]
  const connectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.fromNodeId === selectedNode.id || edge.toNodeId === selectedNode.id)
    : []

  if (graph.nodes.length === 0) {
    return <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">No graph nodes are available yet.</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="overflow-hidden rounded-lg border bg-card">
        <svg viewBox="0 0 900 560" role="img" aria-label="Reasoning graph" className="h-[560px] w-full bg-[#090d0c]">
          {graph.edges.map((edge) => {
            const from = layout.get(edge.fromNodeId)
            const to = layout.get(edge.toNodeId)
            if (!from || !to) return null
            return (
              <line
                key={edge.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={edge.reviewState === "approved" ? "#86efac" : "#64748b"}
                strokeOpacity={Math.min(0.78, 0.22 + edge.weight * 0.08)}
                strokeWidth={Math.min(7, 1 + edge.weight)}
              />
            )
          })}
          {graph.nodes.map((node) => {
            const point = layout.get(node.id)
            if (!point) return null
            const selected = selectedNode?.id === node.id
            const radius = Math.min(28, 8 + node.weightedDegree * 1.4)
            return (
              <g
                key={node.id}
                role="button"
                tabIndex={0}
                aria-label={`Select ${node.label}`}
                className="cursor-pointer"
                onClick={() => setSelectedNodeId(node.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") setSelectedNodeId(node.id)
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={clusterColor(node.clusterKey)}
                  stroke={selected ? "#f8fafc" : "#0f172a"}
                  strokeWidth={selected ? 4 : 1.5}
                  opacity={node.reviewState === "rejected" ? 0.38 : 0.9}
                />
                <text
                  x={point.x}
                  y={point.y + radius + 16}
                  textAnchor="middle"
                  className="fill-slate-100 text-[11px]"
                >
                  {node.label.length > 24 ? `${node.label.slice(0, 22)}...` : node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <aside className="rounded-lg border bg-card p-4">
        {selectedNode ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected concept</p>
              <h3 className="mt-1 text-lg font-semibold">{selectedNode.label}</h3>
              <p className="mt-1 text-xs text-muted-foreground">Review: {selectedNode.reviewState}</p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <Metric label="Degree" value={selectedNode.degree} />
              <Metric label="Weighted" value={selectedNode.weightedDegree} />
              <Metric label="Betweenness" value={selectedNode.betweenness} />
              <Metric label="Bridge" value={selectedNode.bridgeScore} />
            </div>
            <div>
              <p className="text-sm font-medium">Connected edges</p>
              <div className="mt-2 space-y-2">
                {connectedEdges.slice(0, 8).map((edge) => {
                  const otherNodeId = edge.fromNodeId === selectedNode.id ? edge.toNodeId : edge.fromNodeId
                  const otherNode = graph.nodes.find((node) => node.id === otherNodeId)
                  return (
                    <div key={edge.id} className="rounded-md border p-2 text-xs">
                      <p className="font-medium">{otherNode?.label ?? "Unknown concept"}</p>
                      <p className="text-muted-foreground">weight {edge.weight} · confidence {Math.round(edge.confidence * 100)}%</p>
                      {edge.rationale && <p className="mt-1 text-muted-foreground">{edge.rationale}</p>}
                    </div>
                  )
                })}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Source evidence</p>
              <div className="mt-2 space-y-2">
                {selectedNode.evidence.slice(0, 5).map((item, index) => (
                  <div key={`${item.sourceTitle}-${index}`} className="rounded-md border bg-muted/30 p-2 text-xs">
                    <p className="font-medium">{item.sourceTitle ?? "Source chunk"}</p>
                    <p className="mt-1 text-muted-foreground">{item.excerpt ?? "No excerpt stored."}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border bg-muted/30 p-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  )
}

function buildLayout(graph: ReasoningGraphViewData) {
  const clusters = Array.from(new Set(graph.nodes.map((node) => node.clusterKey ?? 0))).sort((left, right) => left - right)
  const clusterIndex = new Map(clusters.map((key, index) => [key, index]))
  const points = new Map<string, { x: number; y: number }>()
  const centerX = 450
  const centerY = 280
  const clusterRadius = 185
  const grouped = new Map<number, typeof graph.nodes>()
  for (const node of graph.nodes) {
    const key = node.clusterKey ?? 0
    grouped.set(key, [...(grouped.get(key) ?? []), node])
  }
  for (const [clusterKey, nodes] of grouped.entries()) {
    const index = clusterIndex.get(clusterKey) ?? 0
    const angle = (Math.PI * 2 * index) / Math.max(1, clusters.length)
    const groupX = centerX + Math.cos(angle) * clusterRadius
    const groupY = centerY + Math.sin(angle) * clusterRadius
    nodes.forEach((node, nodeIndex) => {
      const localAngle = (Math.PI * 2 * nodeIndex) / Math.max(1, nodes.length)
      const localRadius = Math.min(92, 28 + nodes.length * 4)
      points.set(node.id, {
        x: groupX + Math.cos(localAngle) * localRadius,
        y: groupY + Math.sin(localAngle) * localRadius,
      })
    })
  }
  return points
}

function clusterColor(clusterKey: number | null) {
  const colors = ["#14b8a6", "#a78bfa", "#f59e0b", "#60a5fa", "#f472b6", "#84cc16", "#fb7185", "#38bdf8"]
  return colors[Math.abs(clusterKey ?? 0) % colors.length]
}
