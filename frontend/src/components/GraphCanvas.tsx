import { useEffect, useMemo } from 'react'
import {
  Background,
  Controls,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  type NodeTypes,
} from '@xyflow/react'
import { useGraphStore } from '../graph/store'
import { WhatNode } from './WhatNode'
import { SpecialNode } from './SpecialNode'
import { SalientTermNode } from './SalientTermNode'

/**
 * Once nodes are measured, re-flow the layout (real sizes → no overlap) and
 * fit the view so every box stays on screen at a readable zoom. Runs on
 * structural changes (node count), not on manual drags.
 */
function LayoutAndFit() {
  const initialized = useNodesInitialized()
  const count = useGraphStore((s) => s.nodes.length)
  const relayout = useGraphStore((s) => s.relayout)
  const { fitView } = useReactFlow()

  useEffect(() => {
    if (!initialized || count === 0) return
    relayout()
    const id = requestAnimationFrame(() => {
      void fitView({ maxZoom: 1, minZoom: 0.2, padding: 0.2, duration: 300 })
    })
    return () => cancelAnimationFrame(id)
  }, [initialized, count, relayout, fitView])

  return null
}

export function GraphCanvas() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const onNodesChange = useGraphStore((s) => s.onNodesChange)

  const nodeTypes = useMemo<NodeTypes>(
    () => ({
      what: WhatNode,
      why: SpecialNode,
      how: SpecialNode,
      'salient-term': SalientTermNode,
    }),
    [],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ maxZoom: 1, padding: 0.2 }}
      proOptions={{ hideAttribution: true }}
    >
      <LayoutAndFit />
      <Background />
      <Controls />
    </ReactFlow>
  )
}
