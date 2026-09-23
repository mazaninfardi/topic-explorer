import { useEffect, useMemo } from 'react'
import { Background, Controls, ReactFlow, useNodesInitialized, type NodeTypes } from '@xyflow/react'
import { useGraphStore } from '../graph/store'
import { WhatNode } from './WhatNode'
import { SpecialNode } from './SpecialNode'
import { SalientTermNode } from './SalientTermNode'

/** Re-flow once nodes have been measured, so layout uses real sizes (no overlap). */
function LayoutOnMeasure() {
  const initialized = useNodesInitialized()
  const count = useGraphStore((s) => s.nodes.length)
  const relayout = useGraphStore((s) => s.relayout)
  useEffect(() => {
    if (initialized) relayout()
  }, [initialized, count, relayout])
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
      fitViewOptions={{ maxZoom: 1 }}
      proOptions={{ hideAttribution: true }}
    >
      <LayoutOnMeasure />
      <Background />
      <Controls />
    </ReactFlow>
  )
}
