import Dagre from '@dagrejs/dagre'
import type { TGEdge, TGNode } from './types'

/** Fallback node size before React Flow has measured the real DOM node. */
const DEFAULT_W = 320
const DEFAULT_H = 200

/**
 * Lay the graph out as a tidy left-to-right tree with dagre. Uses each node's
 * measured size when available (React Flow populates `node.measured` after
 * render), falling back to estimates. Returns new node objects with positions;
 * edges are unchanged.
 */
export function layoutGraph(nodes: TGNode[], edges: TGEdge[]): TGNode[] {
  if (nodes.length === 0) return nodes

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 120, marginx: 24, marginy: 24 })

  for (const n of nodes) {
    g.setNode(n.id, {
      width: n.measured?.width ?? DEFAULT_W,
      height: n.measured?.height ?? DEFAULT_H,
    })
  }
  for (const e of edges) g.setEdge(e.source, e.target)

  Dagre.layout(g)

  return nodes.map((n) => {
    const { x, y, width, height } = g.node(n.id)
    // dagre gives center coordinates; React Flow positions by top-left.
    return { ...n, position: { x: x - width / 2, y: y - height / 2 } }
  })
}
