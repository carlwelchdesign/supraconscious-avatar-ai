"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { LineBasicMaterial, Mesh, MeshBasicMaterial } from "three"

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

type LayoutPoint = { x: number; y: number; z: number }

export function ReasoningGraphView({ graph }: { graph: ReasoningGraphViewData }) {
  const [selectedNodeId, setSelectedNodeId] = useState(graph.nodes[0]?.id ?? "")
  const [activeViewId, setActiveViewId] = useState("")
  const canvasViews = useMemo(() => buildCanvasViews(graph), [graph])
  const activeView = canvasViews.find((view) => view.id === activeViewId) ?? canvasViews[0]

  const selectedNode = activeView?.graph.nodes.find((node) => node.id === selectedNodeId) ?? activeView?.graph.nodes[0] ?? graph.nodes[0]
  const connectedEdges = selectedNode && activeView
    ? activeView.graph.edges.filter((edge) => edge.fromNodeId === selectedNode.id || edge.toNodeId === selectedNode.id)
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
              onClick={() => {
                setActiveViewId(view.id)
                setSelectedNodeId(view.graph.nodes[0]?.id ?? "")
              }}
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
          <div className="overflow-hidden rounded-lg border bg-[#070908]">
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
                  const otherNode = activeView?.graph.nodes.find((node) => node.id === otherNodeId)
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
  layout: Map<string, LayoutPoint>
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
      renderer.setClearColor(0x070908, 1)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

      const scene = new THREE.Scene()
      const camera = new THREE.OrthographicCamera(-540, 540, 380, -380, -500, 500)
      camera.position.set(0, 0, 120)
      camera.lookAt(0, 0, 0)

      const graphGroup = new THREE.Group()
      scene.add(graphGroup)

      const nodeMeshes = new Map<string, Mesh>()
      const nodeMaterials = new Map<string, MeshBasicMaterial>()
      const ringMeshes = new Map<string, Mesh>()
      const ringMaterials = new Map<string, MeshBasicMaterial>()
      const labelElements = new Map<string, HTMLButtonElement>()
      const edgeMaterials: Array<{ edge: ReasoningGraphViewData["edges"][number]; material: LineBasicMaterial }> = []
      const nodeById = new Map(graph.nodes.map((node) => [node.id, node]))
      const nodeColors = new Map(graph.nodes.map((node) => [node.id, nodeColor(node)]))
      const neighborIdsByNode = buildNeighborMap(graph)
      const defaultLabeledNodeIds = new Set(selectLabeledNodeIds(graph))
      const nodeGeometry = new THREE.CircleGeometry(1, 36)
      const ringGeometry = new THREE.RingGeometry(1.08, 1.16, 72)

      for (const edge of graph.edges) {
        const from = layout.get(edge.fromNodeId)
        const to = layout.get(edge.toNodeId)
        if (!from || !to) continue
        const edgeColor = edge.reviewState === "approved" ? 0xf3d276 : 0xaec4ff
        const material = new THREE.LineBasicMaterial({
          color: edgeColor,
          opacity: edgeOpacity(edge, false),
          transparent: true,
        })
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(from.x, from.y, -1),
          new THREE.Vector3(to.x, to.y, -1),
        ])
        const line = new THREE.Line(geometry, material)
        graphGroup.add(line)
        edgeMaterials.push({ edge, material })
      }

      for (const node of graph.nodes) {
        const point = layout.get(node.id)
        if (!point) continue
        const radius = nodeRadius(node, isPrimary)
        const color = nodeColors.get(node.id) ?? "#94a3b8"
        const material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          opacity: node.reviewState === "rejected" ? 0.36 : 0.92,
          transparent: true,
        })
        const mesh = new THREE.Mesh(nodeGeometry, material)
        mesh.position.set(point.x, point.y, 2)
        mesh.scale.setScalar(radius)
        mesh.userData.nodeId = node.id
        graphGroup.add(mesh)
        nodeMeshes.set(node.id, mesh)
        nodeMaterials.set(node.id, material)

        const ringMaterial = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
          opacity: 0,
          transparent: true,
        })
        const ring = new THREE.Mesh(ringGeometry, ringMaterial)
        ring.position.set(point.x, point.y, 3)
        ring.scale.setScalar(radius * 1.18)
        graphGroup.add(ring)
        ringMeshes.set(node.id, ring)
        ringMaterials.set(node.id, ringMaterial)

        const labelButton = document.createElement("button")
        labelButton.type = "button"
        labelButton.textContent = node.label
        labelButton.className = "absolute max-w-44 truncate rounded-sm border border-white/10 bg-[#080b0a]/80 px-2 py-1 text-left text-[11px] font-medium text-slate-100 shadow-sm backdrop-blur transition"
        labelButton.addEventListener("click", (event) => {
          event.stopPropagation()
          onSelectNode(node.id)
        })
        labelLayer.appendChild(labelButton)
        labelElements.set(node.id, labelButton)
      }

      const raycaster = new THREE.Raycaster()
      const pointer = new THREE.Vector2()
      const baseNodeScales = new Map<string, number>()
      const baseRingScales = new Map<string, number>()
      const hoverNodeRef = { current: "" }
      const dragState = { active: false, lastX: 0, lastY: 0, startX: 0, startY: 0, panned: false }
      for (const [nodeId, mesh] of nodeMeshes.entries()) {
        baseNodeScales.set(nodeId, mesh.scale.x)
      }
      for (const [nodeId, mesh] of ringMeshes.entries()) {
        baseRingScales.set(nodeId, mesh.scale.x)
      }

      function resize() {
        const parent = graphCanvas.parentElement
        const width = parent?.clientWidth ?? 960
        const height = isPrimary ? 820 : 740
        const aspect = width / height
        const worldHeight = isPrimary ? 760 : 700
        renderer.setSize(width, height, false)
        camera.left = -worldHeight * aspect * 0.5
        camera.right = worldHeight * aspect * 0.5
        camera.top = worldHeight * 0.5
        camera.bottom = -worldHeight * 0.5
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
        dragState.panned = false
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
        const hoverNodeId = hoverHit?.object.userData.nodeId
        hoverNodeRef.current = typeof hoverNodeId === "string" ? hoverNodeId : ""
        graphCanvas.style.cursor = hoverHit ? "pointer" : dragState.active ? "grabbing" : "grab"

        if (!dragState.active) return
        const deltaX = event.clientX - dragState.lastX
        const deltaY = event.clientY - dragState.lastY
        const worldUnitsPerPixel = (camera.top - camera.bottom) / Math.max(1, rect.height) / camera.zoom
        camera.position.x -= deltaX * worldUnitsPerPixel
        camera.position.y += deltaY * worldUnitsPerPixel
        dragState.panned = dragState.panned || Math.abs(deltaX) + Math.abs(deltaY) > 2
        dragState.lastX = event.clientX
        dragState.lastY = event.clientY
        camera.updateProjectionMatrix()
      }

      function handlePointerUp(event: PointerEvent) {
        const moved = Math.abs(event.clientX - dragState.startX) + Math.abs(event.clientY - dragState.startY)
        dragState.active = false
        graphCanvas.releasePointerCapture(event.pointerId)
        if (moved < 4 && !dragState.panned) selectFromPointer(event)
      }

      function handlePointerLeave() {
        hoverNodeRef.current = ""
        graphCanvas.style.cursor = "grab"
      }

      function handleWheel(event: WheelEvent) {
        event.preventDefault()
        const zoomDelta = event.deltaY > 0 ? 0.9 : 1.1
        camera.zoom = clamp(camera.zoom * zoomDelta, 0.65, 3.8)
        camera.updateProjectionMatrix()
      }

      function updateLabels() {
        const width = graphCanvas.clientWidth
        const height = graphCanvas.clientHeight
        const selectedNode = selectedNodeRef.current
        const focusNode = hoverNodeRef.current || selectedNode
        const selectedNeighbors = neighborIdsByNode.get(selectedNode) ?? new Set<string>()
        const focusNeighbors = neighborIdsByNode.get(focusNode) ?? new Set<string>()
        for (const [nodeId, element] of labelElements.entries()) {
          const mesh = nodeMeshes.get(nodeId)
          const node = nodeById.get(nodeId)
          if (!mesh || !node) continue
          const selected = nodeId === selectedNode
          const focused = nodeId === focusNode
          const neighbor = selectedNeighbors.has(nodeId)
          const focusNeighbor = focusNeighbors.has(nodeId)
          const defaultVisible = defaultLabeledNodeIds.has(nodeId)
          const show = selected || focused || neighbor || focusNeighbor || defaultVisible
          const position = mesh.position.clone()
          position.project(camera)
          const onScreen = position.z > -1 && position.z < 1 && position.x > -1.05 && position.x < 1.05 && position.y > -1.05 && position.y < 1.05
          const visible = show && onScreen
          const x = (position.x * 0.5 + 0.5) * width
          const y = (-position.y * 0.5 + 0.5) * height
          element.style.transform = `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0) translate(-50%, -140%)`
          element.style.opacity = visible ? (selected || focused ? "1" : neighbor || focusNeighbor ? "0.9" : "0.68") : "0"
          element.style.pointerEvents = visible ? "auto" : "none"
          element.style.zIndex = selected || focused ? "30" : neighbor || focusNeighbor ? "20" : "10"
          element.style.borderColor = selected
            ? "rgba(248, 250, 252, 0.95)"
            : focused
              ? "rgba(125, 211, 252, 0.9)"
              : neighbor || focusNeighbor
                ? "rgba(226, 232, 240, 0.42)"
                : "rgba(255, 255, 255, 0.14)"
          element.style.background = selected
            ? "rgba(242, 211, 118, 0.94)"
            : focused
              ? "rgba(14, 165, 233, 0.9)"
              : neighbor || focusNeighbor
                ? "rgba(16, 22, 20, 0.9)"
                : "rgba(8, 11, 10, 0.78)"
          element.style.color = selected ? "#11120d" : focused ? "#f8fafc" : "#e2e8f0"
        }
      }

      resize()
      window.addEventListener("resize", resize)
      graphCanvas.addEventListener("pointerdown", handlePointerDown)
      graphCanvas.addEventListener("pointermove", handlePointerMove)
      graphCanvas.addEventListener("pointerup", handlePointerUp)
      graphCanvas.addEventListener("pointerleave", handlePointerLeave)
      graphCanvas.addEventListener("wheel", handleWheel, { passive: false })

      let animationFrame = 0
      function animate() {
        animationFrame = requestAnimationFrame(animate)
        const selectedNode = selectedNodeRef.current
        const hoverNode = hoverNodeRef.current
        const focusNode = hoverNode || selectedNode
        const selectedNeighbors = neighborIdsByNode.get(selectedNode) ?? new Set<string>()
        const focusNeighbors = neighborIdsByNode.get(focusNode) ?? new Set<string>()

        for (const [nodeId, mesh] of nodeMeshes.entries()) {
          const selected = nodeId === selectedNode
          const hovered = nodeId === hoverNode
          const focused = nodeId === focusNode
          const selectedNeighbor = selectedNeighbors.has(nodeId)
          const focusNeighbor = focusNeighbors.has(nodeId)
          const connected = selectedNeighbor || focusNeighbor
          mesh.scale.setScalar((baseNodeScales.get(nodeId) ?? 1) * (selected ? 1.34 : hovered ? 1.28 : connected ? 1.13 : 0.94))
          const material = nodeMaterials.get(nodeId)
          if (material) {
            material.opacity = selected || focused ? 1 : connected ? 0.94 : 0.34
          }

          const ring = ringMeshes.get(nodeId)
          const ringMaterial = ringMaterials.get(nodeId)
          if (ring && ringMaterial) {
            ring.scale.setScalar((baseRingScales.get(nodeId) ?? 1) * (selected ? 1.18 : hovered ? 1.14 : connected ? 1.04 : 1))
            ringMaterial.color.setHex(selected ? 0xf8fafc : hovered ? 0x7dd3fc : connected ? 0xf6d365 : 0xffffff)
            ringMaterial.opacity = selected ? 0.74 : hovered ? 0.62 : connected ? 0.34 : 0
          }
        }

        for (const { edge, material } of edgeMaterials) {
          const connectedToFocus = edge.fromNodeId === focusNode || edge.toNodeId === focusNode
          const connectedToSelected = edge.fromNodeId === selectedNode || edge.toNodeId === selectedNode
          material.opacity = edgeOpacity(edge, connectedToFocus || connectedToSelected, Boolean(focusNode))
          material.color.setHex(connectedToFocus ? 0xf8e7a1 : connectedToSelected ? 0xf6d365 : edge.reviewState === "approved" ? 0xc4b47a : 0x7f93bd)
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
        graphCanvas.removeEventListener("pointerleave", handlePointerLeave)
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
    <div className={`relative w-full ${isPrimary ? "h-[720px] xl:h-[820px]" : "h-[660px] xl:h-[740px]"}`}>
      <canvas ref={canvasRef} aria-label="Interactive reasoning graph" className="h-full w-full" />
      <div ref={labelLayerRef} className="pointer-events-none absolute inset-0 [&>button]:pointer-events-auto" />
      <div className="pointer-events-none absolute left-4 top-4 max-w-md rounded-md border border-white/10 bg-[#080b0a]/82 px-3 py-2 text-xs text-slate-200 shadow-sm backdrop-blur">
        <p className="font-medium">{title}</p>
        <p className="mt-1 text-slate-400">{description}</p>
        <div className="mt-3 grid gap-1 text-[11px] text-slate-400 sm:grid-cols-2">
          <p><span className="text-slate-200">Color</span> = concept</p>
          <p><span className="text-slate-200">Size</span> = centrality</p>
          <p><span className="text-slate-200">Brightness</span> = strength</p>
          <p><span className="text-slate-200">Labels</span> = key nodes</p>
        </div>
        <p className="mt-2 text-slate-500">Drag to pan · scroll to zoom · click a node or label</p>
      </div>
      {selectedNode && (
        <div className="pointer-events-none absolute bottom-4 left-4 max-w-sm rounded-md border border-white/10 bg-[#080b0a]/85 px-3 py-2 text-xs text-slate-200 shadow-sm">
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
  const requiredLabels = selectTopNodeIds(graph.nodes, 9, "weighted")
  const bridgeLabels = selectTopNodeIds(graph.nodes, 5, "bridge")
  return new Set([...requiredLabels, ...bridgeLabels])
}

function buildNeighborMap(graph: ReasoningGraphViewData) {
  const neighbors = new Map<string, Set<string>>()
  for (const node of graph.nodes) {
    neighbors.set(node.id, new Set())
  }
  for (const edge of graph.edges) {
    neighbors.get(edge.fromNodeId)?.add(edge.toNodeId)
    neighbors.get(edge.toNodeId)?.add(edge.fromNodeId)
  }
  return neighbors
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
  const points = new Map<string, LayoutPoint>()
  const sortedNodes = [...graph.nodes].sort((left, right) => right.weightedDegree - left.weightedDegree || left.label.localeCompare(right.label))
  const clusters = [...new Set(sortedNodes.map((node) => node.clusterKey ?? -1))].sort((left, right) => left - right)
  const clusterCenters = new Map<number, { x: number; y: number }>()
  const clusterRadius = clusters.length <= 1 ? 0 : 230

  clusters.forEach((cluster, index) => {
    const angle = -Math.PI / 2 + (index / Math.max(1, clusters.length)) * Math.PI * 2
    clusterCenters.set(cluster, {
      x: Math.cos(angle) * clusterRadius,
      y: Math.sin(angle) * clusterRadius,
    })
  })

  const nodesByCluster = new Map<number, typeof sortedNodes>()
  for (const node of sortedNodes) {
    const cluster = node.clusterKey ?? -1
    nodesByCluster.set(cluster, [...(nodesByCluster.get(cluster) ?? []), node])
  }

  for (const [cluster, nodes] of nodesByCluster.entries()) {
    const center = clusterCenters.get(cluster) ?? { x: 0, y: 0 }
    nodes.forEach((node, index) => {
      const ring = 46 + Math.sqrt(index + 1) * 28
      const angle = index * 2.399963229728653 + seededUnit(node.id) * 0.45
      points.set(node.id, {
        x: center.x + Math.cos(angle) * ring,
        y: center.y + Math.sin(angle) * ring,
        z: 0,
      })
    })
  }

  for (let iteration = 0; iteration < 90; iteration += 1) {
    const forces = new Map(sortedNodes.map((node) => [node.id, { x: 0, y: 0 }]))

    for (let leftIndex = 0; leftIndex < sortedNodes.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < sortedNodes.length; rightIndex += 1) {
        const left = sortedNodes[leftIndex]
        const right = sortedNodes[rightIndex]
        const leftPoint = points.get(left.id)
        const rightPoint = points.get(right.id)
        if (!leftPoint || !rightPoint) continue
        let dx = leftPoint.x - rightPoint.x
        let dy = leftPoint.y - rightPoint.y
        let distanceSquared = dx * dx + dy * dy
        if (distanceSquared < 0.01) {
          dx = seededUnit(left.id) - 0.5
          dy = seededUnit(right.id) - 0.5
          distanceSquared = dx * dx + dy * dy
        }
        const distance = Math.sqrt(distanceSquared)
        const sameCluster = (left.clusterKey ?? -1) === (right.clusterKey ?? -1)
        const minDistance = nodeRadius(left, true) + nodeRadius(right, true) + (sameCluster ? 42 : 70)
        const strength = distance < minDistance ? 0.12 : sameCluster ? 0.028 : 0.044
        const force = Math.min(9, (strength * minDistance * minDistance) / Math.max(1, distanceSquared))
        const fx = (dx / Math.max(1, distance)) * force
        const fy = (dy / Math.max(1, distance)) * force
        const leftForce = forces.get(left.id)
        const rightForce = forces.get(right.id)
        if (leftForce) {
          leftForce.x += fx
          leftForce.y += fy
        }
        if (rightForce) {
          rightForce.x -= fx
          rightForce.y -= fy
        }
      }
    }

    for (const edge of graph.edges) {
      const from = points.get(edge.fromNodeId)
      const to = points.get(edge.toNodeId)
      if (!from || !to) continue
      const dx = to.x - from.x
      const dy = to.y - from.y
      const distance = Math.max(1, Math.hypot(dx, dy))
      const target = clamp(160 - edge.weight * 10 - edge.confidence * 18, 78, 165)
      const strength = 0.018 + edge.weight * 0.004 + edge.confidence * 0.01
      const pull = (distance - target) * strength
      const fx = (dx / distance) * pull
      const fy = (dy / distance) * pull
      const fromForce = forces.get(edge.fromNodeId)
      const toForce = forces.get(edge.toNodeId)
      if (fromForce) {
        fromForce.x += fx
        fromForce.y += fy
      }
      if (toForce) {
        toForce.x -= fx
        toForce.y -= fy
      }
    }

    for (const node of sortedNodes) {
      const point = points.get(node.id)
      const force = forces.get(node.id)
      if (!point || !force) continue
      const cluster = node.clusterKey ?? -1
      const clusterCenter = clusterCenters.get(cluster) ?? { x: 0, y: 0 }
      force.x += (clusterCenter.x - point.x) * 0.008
      force.y += (clusterCenter.y - point.y) * 0.008
      force.x += -point.x * 0.002
      force.y += -point.y * 0.002
      points.set(node.id, {
        x: point.x + clamp(force.x, -16, 16),
        y: point.y + clamp(force.y, -16, 16),
        z: 0,
      })
    }
  }

  normalizeLayout(points, 760, 560)
  return points
}

function normalizeLayout(points: Map<string, LayoutPoint>, targetWidth: number, targetHeight: number) {
  if (points.size === 0) return
  const values = [...points.values()]
  const minX = Math.min(...values.map((point) => point.x))
  const maxX = Math.max(...values.map((point) => point.x))
  const minY = Math.min(...values.map((point) => point.y))
  const maxY = Math.max(...values.map((point) => point.y))
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)
  const scale = Math.min(targetWidth / width, targetHeight / height, 1.8)
  const centerX = minX + width / 2
  const centerY = minY + height / 2

  for (const [nodeId, point] of points.entries()) {
    points.set(nodeId, {
      x: (point.x - centerX) * scale,
      y: (point.y - centerY) * scale,
      z: 0,
    })
  }
}

function nodeRadius(node: ReasoningGraphViewData["nodes"][number], isPrimary: boolean) {
  return clamp(6 + Math.sqrt(Math.max(0, node.weightedDegree)) * (isPrimary ? 2.2 : 1.8) + Math.sqrt(Math.max(0, node.bridgeScore)) * 0.8, 7, isPrimary ? 22 : 18)
}

function edgeOpacity(edge: ReasoningGraphViewData["edges"][number], selected: boolean, hasFocus = false) {
  const base = edge.reviewState === "approved" ? 0.34 : 0.22
  const strength = edge.weight * 0.075 + edge.confidence * 0.18
  if (selected) return clamp((base + strength) * 1.45, 0.52, 0.98)
  return clamp((base + strength) * (hasFocus ? 0.42 : 1), hasFocus ? 0.1 : 0.18, hasFocus ? 0.28 : 0.74)
}

function nodeColor(node: ReasoningGraphViewData["nodes"][number]) {
  const seed = seededUnit(`${node.key}:${node.id}`)
  const hue = Math.round((seed * 360 + (node.clusterKey ?? 0) * 37) % 360)
  const saturation = 72 + Math.round(seededUnit(`${node.id}:sat`) * 16)
  const lightness = 54 + Math.round(seededUnit(`${node.key}:light`) * 12)
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function seededUnit(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 10000) / 10000
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
