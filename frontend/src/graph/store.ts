import { create } from 'zustand'
import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { TGEdge, TGNode, TGNodeData } from './types'
import { ROOT_POSITION, childPosition } from './layout'

export const ROOT_ID = 'root'

const expansionKey = (parentId: string, term: string) =>
  `${parentId}::${term.toLowerCase()}`

let idCounter = 0
const nextId = () => `n${(idCounter += 1)}`

interface GraphState {
  nodes: TGNode[]
  edges: TGEdge[]
  /** Set of `${parentId}::${term}` pairs already expanded (dedupe guard). */
  expansions: Set<string>
  error: string | null

  /** Replace the whole graph with a fresh root What node. */
  setRoot: (data: TGNodeData) => void
  /**
   * Expand `term` from `parentId` into a new child node + connecting edge.
   * A repeat expansion of the same (parent, term) is a no-op.
   */
  addChildNode: (parentId: string, term: string, content: TGNodeData) => void
  onNodesChange: (changes: NodeChange<TGNode>[]) => void
  setError: (message: string | null) => void
  reset: () => void
}

const EMPTY: Pick<GraphState, 'nodes' | 'edges' | 'expansions' | 'error'> = {
  nodes: [],
  edges: [],
  expansions: new Set<string>(),
  error: null,
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  ...EMPTY,

  setRoot: (data) =>
    set({
      nodes: [{ id: ROOT_ID, type: data.kind, position: ROOT_POSITION, data }],
      edges: [],
      expansions: new Set<string>(),
      error: null,
    }),

  addChildNode: (parentId, term, content) => {
    const { nodes, edges, expansions } = get()
    const key = expansionKey(parentId, term)
    if (expansions.has(key)) return

    const parent = nodes.find((n) => n.id === parentId)
    if (!parent) return

    const childIndex = edges.filter((e) => e.source === parentId).length
    const id = nextId()
    const node: TGNode = {
      id,
      type: content.kind,
      position: childPosition(parent.position, childIndex),
      data: content,
    }
    const edge: TGEdge = { id: `e-${parentId}-${id}`, source: parentId, target: id }

    const nextExpansions = new Set(expansions)
    nextExpansions.add(key)
    set({ nodes: [...nodes, node], edges: [...edges, edge], expansions: nextExpansions })
  },

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),

  setError: (message) => set({ error: message }),

  reset: () => set({ ...EMPTY, expansions: new Set<string>() }),
}))
