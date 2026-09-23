import { useEffect, useMemo, useRef } from 'react'
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  type Node,
  type NodeTypes,
} from '@xyflow/react'
import { useGraphStore } from '../graph/store'
import type { TGNode } from '../graph/types'
import { WhatNode } from './WhatNode'
import { SpecialNode } from './SpecialNode'
import { SalientTermNode } from './SalientTermNode'

const NODE_COLOR: Record<string, string> = {
  what: '#0ea5e9', // sky-500
  why: '#f59e0b', // amber-500
  how: '#8b5cf6', // violet-500
  'salient-term': '#94a3b8', // slate-400
}

/** True if the node's box isn't comfortably within the visible pane. */
function isOffscreen(node: Node, viewport: { x: number; y: number; zoom: number }, pane: DOMRect): boolean {
  const w = (node.measured?.width ?? node.width ?? 0) * viewport.zoom
  const h = (node.measured?.height ?? node.height ?? 0) * viewport.zoom
  const left = node.position.x * viewport.zoom + viewport.x
  const top = node.position.y * viewport.zoom + viewport.y
  const m = 24
  return left < m || top < m || left + w > pane.width - m || top + h > pane.height - m
}

/**
 * Camera policy that respects the reader:
 *  - fit-to-view only when a whole new graph appears (topicKey changes),
 *  - on expansion, gently pan a newly added node into view *only if* it's
 *    offscreen, always keeping the user's current zoom — never refit the graph.
 * The user's manual pan/zoom is therefore never overridden except when they
 * start a brand-new exploration; React Flow's Controls offer an explicit fit.
 */
function CameraController() {
  const initialized = useNodesInitialized()
  const count = useGraphStore((s) => s.nodes.length)
  const topicKey = useGraphStore((s) => s.topicKey)
  const lastAddedId = useGraphStore((s) => s.lastAddedId)
  const relayout = useGraphStore((s) => s.relayout)
  const rf = useReactFlow()
  const prevTopic = useRef<string | null>(null)

  // Re-run dagre with real measured sizes once nodes render (structural change).
  useEffect(() => {
    if (initialized && count > 0) relayout()
  }, [initialized, count, relayout])

  useEffect(() => {
    if (!initialized || count === 0) return
    const raf = requestAnimationFrame(() => {
      if (prevTopic.current !== topicKey) {
        prevTopic.current = topicKey
        void rf.fitView({ maxZoom: 1, minZoom: 0.2, padding: 0.2, duration: 300 })
        return
      }
      if (!lastAddedId) return
      const node = rf.getNode(lastAddedId)
      const pane = document.querySelector('.react-flow')?.getBoundingClientRect()
      if (!node || !pane || !isOffscreen(node, rf.getViewport(), pane)) return
      const w = node.measured?.width ?? node.width ?? 0
      const h = node.measured?.height ?? node.height ?? 0
      void rf.setCenter(node.position.x + w / 2, node.position.y + h / 2, { zoom: rf.getZoom(), duration: 300 })
    })
    return () => cancelAnimationFrame(raf)
  }, [initialized, count, topicKey, lastAddedId, rf])

  return null
}

export function GraphCanvas() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const onNodesChange = useGraphStore((s) => s.onNodesChange)
  const currentTitle = useGraphStore((s) => (s.nodes.length > 0 ? s.currentTopic?.title : null))

  const nodeTypes = useMemo<NodeTypes>(
    () => ({ what: WhatNode, why: SpecialNode, how: SpecialNode, 'salient-term': SalientTermNode }),
    [],
  )

  // Structural edges (What→Why/How) read solid; definition edges read lighter/dashed.
  const styledEdges = useMemo(() => {
    const kindOf = new Map(nodes.map((n) => [n.id, (n as TGNode).data.kind]))
    return edges.map((e) =>
      kindOf.get(e.target) === 'salient-term'
        ? { ...e, style: { stroke: '#cbd5e1', strokeDasharray: '4 4' } }
        : { ...e, style: { stroke: '#94a3b8', strokeWidth: 1.5 } },
    )
  }, [edges, nodes])

  return (
    <div className="relative h-full w-full">
      {currentTitle && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 max-w-[min(90%,28rem)] truncate rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-medium text-slate-600 shadow-sm backdrop-blur">
          {currentTitle}
        </div>
      )}
      <ReactFlow
        nodes={nodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        nodeTypes={nodeTypes}
        minZoom={0.2}
        proOptions={{ hideAttribution: true }}
      >
        <CameraController />
        <Background />
        <Controls showInteractive={false} />
        <MiniMap
          pannable
          zoomable
          nodeColor={(n) => NODE_COLOR[(n as TGNode).data?.kind] ?? '#cbd5e1'}
          nodeStrokeWidth={2}
          className="!bottom-3 !right-3 hidden sm:block"
        />
      </ReactFlow>
    </div>
  )
}
