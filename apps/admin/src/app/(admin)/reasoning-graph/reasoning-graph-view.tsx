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
      <div className="overflow-hidden rounded-lg border bg-[#050807]">
        <ReasoningGraphCanvas
          graph={graph}
          layout={layout}
          selectedNodeId={selectedNode?.id ?? ""}
          onSelectNode={setSelectedNodeId}
        />
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
  graph,
  layout,
  selectedNodeId,
  onSelectNode,
}: {
  graph: ReasoningGraphViewData
  layout: Map<string, { x: number; y: number; z: number }>
  selectedNodeId: string
  onSelectNode: (nodeId: string) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const selectedNodeRef = useRef(selectedNodeId)

  useEffect(() => {
    selectedNodeRef.current = selectedNodeId
  }, [selectedNodeId])

  useEffect(() => {
    let cancelled = false
    let cleanup = () => {}

    async function mountScene() {
      const canvas = canvasRef.current
      if (!canvas) return
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

      scene.add(new THREE.AmbientLight(0x8df5dd, 0.42))
      const keyLight = new THREE.PointLight(0xa7f3d0, 1200, 1800)
      keyLight.position.set(260, 280, 520)
      scene.add(keyLight)
      const violetLight = new THREE.PointLight(0xa78bfa, 650, 1600)
      violetLight.position.set(-340, -180, 420)
      scene.add(violetLight)

      const nodeMeshes = new Map<string, Mesh>()
      const nodeGeometry = new THREE.SphereGeometry(1, 24, 18)
      for (const node of graph.nodes) {
        const point = layout.get(node.id)
        if (!point) continue
        const radius = Math.min(24, 7 + Math.sqrt(node.weightedDegree) * 3.2)
        const material = new THREE.MeshStandardMaterial({
          color: new THREE.Color(clusterColor(node.clusterKey)),
          emissive: new THREE.Color(clusterColor(node.clusterKey)),
          emissiveIntensity: node.reviewState === "approved" ? 0.45 : 0.24,
          metalness: 0.12,
          opacity: node.reviewState === "rejected" ? 0.32 : 0.94,
          roughness: 0.38,
          transparent: true,
        })
        const mesh = new THREE.Mesh(nodeGeometry, material)
        mesh.position.set(point.x, point.y, point.z)
        mesh.scale.setScalar(radius)
        mesh.userData.nodeId = node.id
        graphGroup.add(mesh)
        nodeMeshes.set(node.id, mesh)

        const halo = new THREE.Mesh(
          new THREE.SphereGeometry(1.25, 24, 18),
          new THREE.MeshBasicMaterial({
            color: new THREE.Color(clusterColor(node.clusterKey)),
            opacity: Math.min(0.32, 0.08 + node.bridgeScore * 0.02),
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
        const geometry = new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(from.x, from.y, from.z),
          new THREE.Vector3(to.x, to.y, to.z),
        ])
        const material = new THREE.LineBasicMaterial({
          color: edge.reviewState === "approved" ? 0x86efac : 0x82a6bd,
          opacity: Math.min(0.82, 0.18 + edge.weight * 0.09),
          transparent: true,
        })
        const line = new THREE.Line(geometry, material)
        graphGroup.add(line)
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
        const height = 620
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
      }
      animate()

      cleanup = () => {
        cancelAnimationFrame(animationFrame)
        window.removeEventListener("resize", resize)
        graphCanvas.removeEventListener("pointerdown", handlePointerDown)
        graphCanvas.removeEventListener("pointermove", handlePointerMove)
        graphCanvas.removeEventListener("pointerup", handlePointerUp)
        graphCanvas.removeEventListener("wheel", handleWheel)
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
  }, [graph, layout, onSelectNode])

  const selectedNode = graph.nodes.find((node) => node.id === selectedNodeId)

  return (
    <div className="relative h-[620px] w-full">
      <canvas ref={canvasRef} aria-label="Interactive 3D reasoning graph" className="h-full w-full" />
      <div className="pointer-events-none absolute left-4 top-4 rounded-md border border-white/10 bg-black/45 px-3 py-2 text-xs text-slate-200 shadow-lg">
        <p className="font-medium">3D reasoning graph</p>
        <p className="mt-1 text-slate-400">Drag to rotate · scroll to zoom · click a concept</p>
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
  const points = new Map<string, { x: number; y: number; z: number }>()
  const clusterRadius = 250
  const grouped = new Map<number, typeof graph.nodes>()
  for (const node of graph.nodes) {
    const key = node.clusterKey ?? 0
    grouped.set(key, [...(grouped.get(key) ?? []), node])
  }
  for (const [clusterKey, nodes] of grouped.entries()) {
    const index = clusterIndex.get(clusterKey) ?? 0
    const phi = Math.acos(1 - (2 * (index + 0.5)) / Math.max(1, clusters.length))
    const theta = Math.PI * (1 + Math.sqrt(5)) * index
    const groupX = Math.cos(theta) * Math.sin(phi) * clusterRadius
    const groupY = Math.sin(theta) * Math.sin(phi) * clusterRadius
    const groupZ = Math.cos(phi) * clusterRadius
    nodes.forEach((node, nodeIndex) => {
      const localAngle = (Math.PI * 2 * nodeIndex) / Math.max(1, nodes.length)
      const localZAngle = (Math.PI * nodeIndex) / Math.max(1, nodes.length - 1)
      const localRadius = Math.min(104, 34 + nodes.length * 3.2)
      points.set(node.id, {
        x: groupX + Math.cos(localAngle) * Math.sin(localZAngle || 0.8) * localRadius,
        y: groupY + Math.sin(localAngle) * Math.sin(localZAngle || 0.8) * localRadius,
        z: groupZ + Math.cos(localZAngle || 0.8) * localRadius,
      })
    })
  }
  return points
}

function clusterColor(clusterKey: number | null) {
  const colors = ["#14b8a6", "#a78bfa", "#f59e0b", "#60a5fa", "#f472b6", "#84cc16", "#fb7185", "#38bdf8"]
  return colors[Math.abs(clusterKey ?? 0) % colors.length]
}
