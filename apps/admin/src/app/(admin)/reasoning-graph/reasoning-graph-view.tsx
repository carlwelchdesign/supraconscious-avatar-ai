"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { Mesh } from "three"

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
  const [activeViewId, setActiveViewId] = useState("")
  const canvasViews = useMemo(() => buildCanvasViews(graph), [graph])
  const activeView = canvasViews.find((view) => view.id === activeViewId) ?? canvasViews[0]
  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId) ?? graph.nodes[0]
  const connectedEdges = selectedNode
    ? graph.edges.filter((edge) => edge.fromNodeId === selectedNode.id || edge.toNodeId === selectedNode.id)
    : []

  if (graph.nodes.length === 0) {
    return <p className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">No graph nodes are available yet.</p>
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 rounded-lg border bg-muted/30 p-2">
          {canvasViews.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveViewId(view.id)}
              className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                view.id === activeView?.id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background/70 hover:text-foreground"
              }`}
            >
              {view.title}
            </button>
          ))}
        </div>
        {activeView && (
          <div className="overflow-hidden rounded-lg border bg-[#050807]">
            <ReasoningGraphCanvas
              title={activeView.title}
              description={activeView.description}
              graph={activeView.graph}
              layout={activeView.layout}
              isPrimary={activeView.id === "network-1"}
              selectedNodeId={selectedNode?.id ?? ""}
              onSelectNode={setSelectedNodeId}
            />
          </div>
        )}
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

function ReasoningGraphCanvas({
  title,
  description,
  graph,
  layout,
  isPrimary,
  selectedNodeId,
  onSelectNode,
}: {
  title: string
  description: string
  graph: ReasoningGraphViewData
  layout: Map<string, { x: number; y: number; z: number }>
  isPrimary: boolean
  selectedNodeId: string
  onSelectNode: (nodeId: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const labelLayerRef = useRef<HTMLDivElement | null>(null)
  const selectedNodeRef = useRef(selectedNodeId)

  useEffect(() => {
    selectedNodeRef.current = selectedNodeId
  }, [selectedNodeId])

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    async function mountScene() {
      const canvas = canvasRef.current
      const labelLayer = labelLayerRef.current
      if (!canvas || !labelLayer) return
      const graphCanvas = canvas
      const THREE = await import("three")
      if (cancelled) return

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, canvas: graphCanvas })
      renderer.setClearColor(0x050807, 1)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x050807, 0.0019)

      const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 2600)
      camera.position.set(0, 0, 860)

      const graphGroup = new THREE.Group()
      scene.add(graphGroup)

      scene.add(new THREE.AmbientLight(isPrimary ? 0xb9f6ff : 0x8df5dd, isPrimary ? 0.5 : 0.42))
      const keyLight = new THREE.PointLight(isPrimary ? 0xfef3c7 : 0xa7f3d0, isPrimary ? 1550 : 1200, 1800)
      keyLight.position.set(260, 280, 520)
      scene.add(keyLight)
      const violetLight = new THREE.PointLight(0xa78bfa, isPrimary ? 920 : 650, 1600)
      violetLight.position.set(-340, -180, 420)
      scene.add(violetLight)

      const nodeMeshes = new Map<string, Mesh>()
      const labelElements = new Map<string, HTMLButtonElement>()
      const nodeGeometry = new THREE.SphereGeometry(1, 24, 18)
      const labeledNodeIds = new Set(selectLabeledNodeIds(graph))
      for (const node of graph.nodes) {
        const point = layout.get(node.id)
        if (!point) continue
        const radius = Math.min(24, 7 + Math.sqrt(node.weightedDegree) * 3.2)
        const color = clusterColor(node.clusterKey, isPrimary)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(color),
          emissive: new THREE.Color(color),
          emissiveIntensity: node.reviewState === "approved" ? (isPrimary ? 0.62 : 0.45) : (isPrimary ? 0.34 : 0.24),
          metalness: isPrimary ? 0.18 : 0.12,
          opacity: node.reviewState === "rejected" ? 0.32 : 0.94,
          roughness: isPrimary ? 0.28 : 0.38,
          transparent: true,
        })
        const mesh = new THREE.Mesh(nodeGeometry, material)
        mesh.position.set(point.x, point.y, point.z)
        mesh.scale.setScalar(radius)
        mesh.userData.nodeId = node.id
        graphGroup.add(mesh)
        nodeMeshes.set(node.id, mesh)

        if (labeledNodeIds.has(node.id)) {
          const labelButton = document.createElement("button")
          labelButton.type = "button"
          labelButton.textContent = node.label
          labelButton.className = "absolute max-w-40 truncate rounded-full border border-white/10 bg-black/60 px-2 py-1 text-left text-[11px] font-medium text-slate-100 shadow-lg backdrop-blur transition"
          labelButton.addEventListener("click", (event) => {
            event.stopPropagation()
            onSelectNode(node.id)
          })
          labelLayer.appendChild(labelButton)
          labelElements.set(node.id, labelButton)
        }

        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(1.25, 24, 18),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(color),
            opacity: Math.min(isPrimary ? 0.42 : 0.32, (isPrimary ? 0.12 : 0.08) + node.bridgeScore * 0.02),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          }),
        )
        halo.position.copy(mesh.position)
        halo.scale.setScalar(radius * 1.75)
        graphGroup.add(halo)
      }

      for (const edge of graph.edges) {
        const from = layout.get(edge.fromNodeId)
        const to = layout.get(edge.toNodeId)
        if (!from || !to) continue
        const fromVector = new THREE.Vector3(from.x, from.y, from.z)
        const toVector = new THREE.Vector3(to.x, to.y, to.z)
        const edgeColor = edge.reviewState === "approved"
          ? (isPrimary ? 0xfde68a : 0x86efac)
          : (isPrimary ? 0x93c5fd : 0x82a6bd)
        const edgeOpacity = Math.min(isPrimary ? 0.96 : 0.82, (isPrimary ? 0.38 : 0.18) + edge.weight * (isPrimary ? 0.12 : 0.09) + edge.confidence * 0.12)
        const material = isPrimary
          ? new THREE.MeshBasicMaterial({
            color: edgeColor,
            opacity: edgeOpacity,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
          })
          : new THREE.LineBasicMaterial({
          color: edgeColor,
          opacity: edgeOpacity,
          transparent: true,
        })
        if (isPrimary) {
          const curve = new THREE.LineCurve3(fromVector, toVector)
          const geometry = new THREE.TubeGeometry(curve, 1, Math.min(4.8, 1.6 + edge.weight * 0.34 + edge.confidence), 8, false)
          const tube = new THREE.Mesh(geometry, material)
          graphGroup.add(tube)
        } else {
          const geometry = new THREE.BufferGeometry().setFromPoints([fromVector, toVector])
          const line = new THREE.Line(geometry, material)
          graphGroup.add(line)
        }
      }

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const baseNodeScales = new Map<string, number>()
      const dragState = { active: false, lastX: 0, lastY: 0, startX: 0, startY: 0 }
      for (const [nodeId, mesh] of nodeMeshes.entries()) {
        baseNodeScales.set(nodeId, mesh.scale.x)
      }

      function resize() {
        const parent = graphCanvas.parentElement
        const width = parent?.clientWidth ?? 900
        const height = isPrimary ? 760 : 680
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
      }

      function selectFromPointer(event: PointerEvent) {
        const rect = graphCanvas.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hits = raycaster.intersectObjects([...nodeMeshes.values()], false)
        const nodeId = hits[0]?.object.userData.nodeId
        if (typeof nodeId === "string") onSelectNode(nodeId)
      }

      function handlePointerDown(event: PointerEvent) {
        dragState.active = true
        dragState.lastX = event.clientX
        dragState.lastY = event.clientY
        dragState.startX = event.clientX
        dragState.startY = event.clientY
        graphCanvas.setPointerCapture(event.pointerId)
      }

      function handlePointerMove(event: PointerEvent) {
        const rect = graphCanvas.getBoundingClientRect()
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        raycaster.setFromCamera(pointer, camera)
        const hoverHit = raycaster.intersectObjects([...nodeMeshes.values()], false)[0]
        graphCanvas.style.cursor = hoverHit ? "pointer" : dragState.active ? "grabbing" : "grab"

        if (!dragState.active) return
        const deltaX = event.clientX - dragState.lastX
        const deltaY = event.clientY - dragState.lastY
        graphGroup.rotation.y += deltaX * 0.006
        graphGroup.rotation.x += deltaY * 0.004
        dragState.lastX = event.clientX
        dragState.lastY = event.clientY
      }

      function handlePointerUp(event: PointerEvent) {
        const moved = Math.abs(event.clientX - dragState.startX) + Math.abs(event.clientY - dragState.startY)
        dragState.active = false
        graphCanvas.releasePointerCapture(event.pointerId)
        if (moved < 4) selectFromPointer(event)
      }

      function handleWheel(event: WheelEvent) {
        event.preventDefault()
        camera.position.z = Math.max(360, Math.min(1300, camera.position.z + event.deltaY * 0.85))
      }

      function updateLabels() {
        const width = graphCanvas.clientWidth
        const height = graphCanvas.clientHeight
        for (const [nodeId, element] of labelElements.entries()) {
          const mesh = nodeMeshes.get(nodeId)
          if (!mesh) continue
          const selected = nodeId === selectedNodeRef.current
          const position = mesh.position.clone()
          graphGroup.localToWorld(position)
          position.project(camera)
          const visible = position.z > -1 && position.z < 1
          const x = (position.x * 0.5 + 0.5) * width
          const y = (-position.y * 0.5 + 0.5) * height
          element.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -50%)`
          element.style.opacity = visible ? (selected ? "1" : "0.76") : "0"
          element.style.zIndex = selected ? "20" : String(Math.max(1, Math.round((1 - position.z) * 10)))
          element.style.borderColor = selected ? "rgba(248, 250, 252, 0.85)" : "rgba(255, 255, 255, 0.12)"
          element.style.background = selected ? "rgba(20, 184, 166, 0.88)" : "rgba(0, 0, 0, 0.6)"
          element.style.color = selected ? "#04110f" : "#e2e8f0"
        }
      }

      resize()
      window.addEventListener("resize", resize)
      graphCanvas.addEventListener("pointerdown", handlePointerDown)
      graphCanvas.addEventListener("pointermove", handlePointerMove)
      graphCanvas.addEventListener("pointerup", handlePointerUp)
      graphCanvas.addEventListener("wheel", handleWheel, { passive: false })

      let animationFrame = 0
      function animate() {
        animationFrame = requestAnimationFrame(animate)
        graphGroup.rotation.y += 0.0011
        for (const [nodeId, mesh] of nodeMeshes.entries()) {
          const selected = nodeId === selectedNodeRef.current
          mesh.scale.setScalar((baseNodeScales.get(nodeId) ?? 1) * (selected ? 1.24 : 1))
          const material = mesh.material
          if (material instanceof THREE.MeshStandardMaterial) {
            material.emissiveIntensity = selected ? 0.86 : 0.28
          }
        }
        renderer.render(scene, camera)
        updateLabels()
      }
      animate()

      cleanup = () => {
        cancelAnimationFrame(animationFrame)
        window.removeEventListener("resize", resize)
        graphCanvas.removeEventListener("pointerdown", handlePointerDown)
        graphCanvas.removeEventListener("pointermove", handlePointerMove)
        graphCanvas.removeEventListener("pointerup", handlePointerUp)
        graphCanvas.removeEventListener("wheel", handleWheel)
        labelLayer.textContent = ""
        graphGroup.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
            object.geometry.dispose()
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose())
            } else {
              object.material.dispose()
            }
          }
        })
        renderer.dispose()
      }
    }

    void mountScene()

    return () => {
      cancelled = true
      cleanup()
    }
  }, [graph, layout, isPrimary, onSelectNode])

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId)

  return (
    <div className={`relative w-full ${isPrimary ? "h-[640px] xl:h-[760px]" : "h-[600px] xl:h-[680px]"}`}>
      <canvas ref={canvasRef} aria-label="Interactive 3D reasoning graph" className="h-full w-full" />
      <div ref={labelLayerRef} className="pointer-events-none absolute inset-0 [&>button]:pointer-events-auto" />
      <div className="pointer-events-none absolute left-4 top-4 max-w-md rounded-md border border-white/10 bg-black/50 px-3 py-2 text-xs text-slate-200 shadow-lg backdrop-blur">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-slate-400">{description}</p>
        <p className="mt-2 text-slate-500">Drag to rotate · scroll to zoom · click a label or node</p>
      </div>
      {selectedNode && (
        <div className="pointer-events-none absolute bottom-4 left-4 max-w-sm rounded-md border border-white/10 bg-black/55 px-3 py-2 text-xs text-slate-200 shadow-lg">
          <p className="text-slate-400">Selected</p>
          <p className="mt-1 text-sm font-medium">{selectedNode.label}</p>
        </div>
      )}
    </div>
  )
}

function buildCanvasViews(graph: ReasoningGraphViewData) {
  const components = splitConnectedComponents(graph)
    .map((component) => trimConnectedGraph(component, 38, 90))
    .filter((component) => component.nodes.length > 0)

  return components.slice(0, 3).map((component, index) => {
    const topLabels = [...component.nodes]
      .sort((left, right) => right.weightedDegree - left.weightedDegree || right.bridgeScore - left.bridgeScore)
      .slice(0, 3)
      .map((node) => node.label)
      .join(", ")
    return {
      id: `network-${index + 1}`,
      title: `Network ${index + 1}`,
      description: topLabels ? `Connected component centered on: ${topLabels}.` : "Connected component from the reasoning graph.",
      graph: component,
      layout: buildLayout(component),
    }
  })
}

function splitConnectedComponents(graph: ReasoningGraphViewData): ReasoningGraphViewData[] {
  const adjacency = new Map<string, Set<string>>()
  for (const node of graph.nodes) {
    adjacency.set(node.id, new Set())
  }
  for (const edge of graph.edges) {
    adjacency.get(edge.fromNodeId)?.add(edge.toNodeId)
    adjacency.get(edge.toNodeId)?.add(edge.fromNodeId)
  }

  const visited = new Set<string>()
  const components: string[][] = []
  for (const node of graph.nodes) {
    if (visited.has(node.id)) continue
    const component: string[] = []
    const queue = [node.id]
    visited.add(node.id)
    while (queue.length > 0) {
      const currentId = queue.shift()
      if (!currentId) continue
      component.push(currentId)
      for (const nextId of adjacency.get(currentId) ?? []) {
        if (visited.has(nextId)) continue
        visited.add(nextId)
        queue.push(nextId)
      }
    }
    components.push(component)
  }

  return components.map((component) => {
    const componentIds = new Set(component)
    const nodes = graph.nodes.filter((node) => componentIds.has(node.id))
    const edges = graph.edges.filter((edge) => componentIds.has(edge.fromNodeId) && componentIds.has(edge.toNodeId))
    return { nodes, edges }
  }).sort((left, right) => componentScore(right) - componentScore(left))
}

function trimConnectedGraph(graph: ReasoningGraphViewData, maxNodes: number, maxEdges: number): ReasoningGraphViewData {
  if (graph.nodes.length <= maxNodes) {
    return {
      nodes: graph.nodes,
      edges: graph.edges.sort((left, right) => right.weight - left.weight || right.confidence - left.confidence).slice(0, maxEdges),
    }
  }

  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
  const edgeByNode = new Map<string, typeof graph.edges>()
  for (const edge of graph.edges) {
    edgeByNode.set(edge.fromNodeId, [...(edgeByNode.get(edge.fromNodeId) ?? []), edge])
    edgeByNode.set(edge.toNodeId, [...(edgeByNode.get(edge.toNodeId) ?? []), edge])
  }

  const seed = [...graph.nodes].sort((left, right) => right.weightedDegree - left.weightedDegree || right.bridgeScore - left.bridgeScore)[0]
  if (!seed) return { nodes: [], edges: [] }

  const selectedIds = new Set([seed.id])
  const frontier = [...(edgeByNode.get(seed.id) ?? [])]
  while (frontier.length > 0 && selectedIds.size < maxNodes) {
    frontier.sort((left, right) => right.weight - left.weight || right.confidence - left.confidence)
    const edge = frontier.shift()
    if (!edge) break
    const nextId = selectedIds.has(edge.fromNodeId) ? edge.toNodeId : edge.fromNodeId
    if (selectedIds.has(nextId) || !nodeById.has(nextId)) continue
    selectedIds.add(nextId)
    frontier.push(...(edgeByNode.get(nextId) ?? []))
  }

  const nodes = graph.nodes.filter((node) => selectedIds.has(node.id))
  const edges = graph.edges
    .filter((edge) => selectedIds.has(edge.fromNodeId) && selectedIds.has(edge.toNodeId))
    .sort((left, right) => right.weight - left.weight || right.confidence - left.confidence)
    .slice(0, maxEdges)
  return { nodes, edges }
}

function componentScore(graph: ReasoningGraphViewData) {
  return graph.nodes.reduce((total, node) => total + node.weightedDegree + node.bridgeScore, 0) + graph.nodes.length * 10 + graph.edges.length
}

function selectTopNodeIds(nodes: ReasoningGraphViewData["nodes"], count: number, metric: "weighted" | "bridge") {
  const sorted = [...nodes].sort((left, right) => (
    metric === "bridge"
      ? right.bridgeScore - left.bridgeScore || right.betweenness - left.betweenness
      : right.weightedDegree - left.weightedDegree || right.degree - left.degree
  ))
  return new Set(sorted.slice(0, count).map((node) => node.id))
}

function selectLabeledNodeIds(graph: ReasoningGraphViewData) {
  const requiredLabels = selectTopNodeIds(graph.nodes, 18, "weighted")
  const bridgeLabels = selectTopNodeIds(graph.nodes, 8, "bridge")
  return new Set([...requiredLabels, ...bridgeLabels])
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
  const points = new Map<string, { x: number; y: number; z: number }>()
  const sortedNodes = [...graph.nodes].sort((left, right) => right.weightedDegree - left.weightedDegree || left.label.localeCompare(right.label))
  const nodeIndex = new Map(sortedNodes.map((node, index) => [node.id, index]))
  const adjacency = new Map<string, Set<string>>()

  for (const edge of graph.edges) {
    adjacency.set(edge.fromNodeId, new Set([...(adjacency.get(edge.fromNodeId) ?? []), edge.toNodeId]))
    adjacency.set(edge.toNodeId, new Set([...(adjacency.get(edge.toNodeId) ?? []), edge.fromNodeId]))
  }

  sortedNodes.forEach((node, index) => {
    const degree = adjacency.get(node.id)?.size ?? 0
    const radius = Math.max(72, 270 - Math.min(210, node.weightedDegree * 7 + degree * 11))
    const phi = Math.acos(1 - (2 * (index + 0.5)) / Math.max(1, sortedNodes.length))
    const theta = Math.PI * (1 + Math.sqrt(5)) * index
    points.set(node.id, {
      x: Math.cos(theta) * Math.sin(phi) * radius,
      y: Math.sin(theta) * Math.sin(phi) * radius,
      z: Math.cos(phi) * radius,
    })
  })

  for (let iteration = 0; iteration < 24; iteration += 1) {
    const nextPoints = new Map(points)
    for (const edge of graph.edges) {
      const from = points.get(edge.fromNodeId)
      const to = points.get(edge.toNodeId)
      if (!from || !to) continue
      const fromRank = nodeIndex.get(edge.fromNodeId) ?? 0
      const toRank = nodeIndex.get(edge.toNodeId) ?? 0
      const pull = Math.min(0.18, 0.035 + edge.weight * 0.012)
      const centerBias = Math.max(0.45, 1 - Math.abs(fromRank - toRank) / Math.max(1, sortedNodes.length))
      const adjustedPull = pull * centerBias
      const nextFrom = nextPoints.get(edge.fromNodeId) ?? from
      const nextTo = nextPoints.get(edge.toNodeId) ?? to

      nextPoints.set(edge.fromNodeId, {
        x: nextFrom.x + (to.x - from.x) * adjustedPull,
        y: nextFrom.y + (to.y - from.y) * adjustedPull,
        z: nextFrom.z + (to.z - from.z) * adjustedPull,
      })
      nextPoints.set(edge.toNodeId, {
        x: nextTo.x + (from.x - to.x) * adjustedPull,
        y: nextTo.y + (from.y - to.y) * adjustedPull,
        z: nextTo.z + (from.z - to.z) * adjustedPull,
      })
    }

    for (const [nodeId, point] of nextPoints.entries()) {
      const magnitude = Math.max(1, Math.hypot(point.x, point.y, point.z))
      const targetRadius = 68 + ((nodeIndex.get(nodeId) ?? 0) / Math.max(1, sortedNodes.length - 1)) * 210
      points.set(nodeId, {
        x: (point.x / magnitude) * targetRadius,
        y: (point.y / magnitude) * targetRadius,
        z: (point.z / magnitude) * targetRadius,
      })
    }
  }

  return points
}

function clusterColor(clusterKey: number | null, highContrast = false) {
  const colors = highContrast
    ? ["#f97316", "#22d3ee", "#e879f9", "#a3e635", "#facc15", "#60a5fa", "#fb7185", "#34d399", "#c084fc", "#f472b6"]
    : ["#14b8a6", "#a78bfa", "#f59e0b", "#60a5fa", "#f472b6", "#84cc16", "#fb7185", "#38bdf8"]
  return colors[Math.abs(clusterKey ?? 0) % colors.length]
}
