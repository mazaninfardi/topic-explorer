import { useMemo } from 'react'
import { Background, Controls, ReactFlow, type NodeTypes } from '@xyflow/react'
import { useGraphStore } from '../graph/store'
import { WhatNode } from './WhatNode'
import { SalientTermNode } from './SalientTermNode'

export function GraphCanvas() {
  const nodes = useGraphStore((s) => s.nodes)
  const edges = useGraphStore((s) => s.edges)
  const onNodesChange = useGraphStore((s) => s.onNodesChange)

  const nodeTypes = useMemo<NodeTypes>(
    () => ({ what: WhatNode, 'salient-term': SalientTermNode }),
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
      <Background />
      <Controls />
    </ReactFlow>
  )
}
