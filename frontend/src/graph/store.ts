import { create } from 'zustand'
import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { TGEdge, TGNode } from './types'
import { ROOT_POSITION, childPosition } from './layout'
import { contentSource } from '../content'

export const ROOT_ID = 'root'
export type SpecialKind = 'why' | 'how'
export type ExtractStatus = 'idle' | 'extracting' | 'ready' | 'error'

let idCounter = 0
const nextId = () => `n${(idCounter += 1)}`
const expansionKey = (parentId: string, term: string) =>
  `${parentId}::${term.toLowerCase()}`

interface GraphState {
  nodes: TGNode[]
  edges: TGEdge[]
  expansions: Set<string>
  specialsOpened: Set<SpecialKind>
  pending: { why?: { text: string; terms: string[] }; how?: { text: string; terms: string[] } }
  status: ExtractStatus
  error: string | null
  unsubscribe: (() => void) | null

  /** Start extracting an arXiv paper; streams What, then Why/How. */
  explore: (ref: string) => void
  /** Open the Why or How special node (once) from the streamed content. */
  openSpecial: (kind: SpecialKind) => void
  /** Expand a salient term into a loading node, then fill it from the model. */
  expandTerm: (parentId: string, term: string) => void
  onNodesChange: (changes: NodeChange<TGNode>[]) => void
  reset: () => void
}

const childIndexOf = (edges: TGEdge[], parentId: string) =>
  edges.filter((e) => e.source === parentId).length

export const useGraphStore = create<GraphState>()((set, get) => ({
  nodes: [],
  edges: [],
  expansions: new Set<string>(),
  specialsOpened: new Set<SpecialKind>(),
  pending: {},
  status: 'idle',
  error: null,
  unsubscribe: null,

  explore: (ref) => {
    get().reset()
    const unsubscribe = contentSource.explore(ref, {
      onWhat: (c) =>
        set({
          nodes: [
            { id: ROOT_ID, type: 'what', position: ROOT_POSITION, data: { kind: 'what', text: c.text, terms: c.terms } },
          ],
          status: 'ready',
        }),
      onWhy: (c) => set((s) => ({ pending: { ...s.pending, why: c } })),
      onHow: (c) => set((s) => ({ pending: { ...s.pending, how: c } })),
      onError: (message) => set({ status: 'error', error: message }),
    })
    set({ status: 'extracting', unsubscribe })
  },

  openSpecial: (kind) => {
    const s = get()
    if (s.specialsOpened.has(kind)) return
    const content = s.pending[kind]
    const root = s.nodes.find((n) => n.id === ROOT_ID)
    if (!content || !root) return

    const id = nextId()
    const node: TGNode = {
      id,
      type: kind,
      position: childPosition(root.position, childIndexOf(s.edges, ROOT_ID)),
      data: { kind, text: content.text, terms: content.terms },
    }
    const edge: TGEdge = { id: `e-${ROOT_ID}-${id}`, source: ROOT_ID, target: id }
    const opened = new Set(s.specialsOpened)
    opened.add(kind)
    set({ nodes: [...s.nodes, node], edges: [...s.edges, edge], specialsOpened: opened })
  },

  expandTerm: (parentId, term) => {
    const s = get()
    const key = expansionKey(parentId, term)
    if (s.expansions.has(key)) return
    const parent = s.nodes.find((n) => n.id === parentId)
    if (!parent) return

    const id = nextId()
    const node: TGNode = {
      id,
      type: 'salient-term',
      position: childPosition(parent.position, childIndexOf(s.edges, parentId)),
      data: { kind: 'salient-term', text: '', terms: [], loading: true },
    }
    const edge: TGEdge = { id: `e-${parentId}-${id}`, source: parentId, target: id }
    const expansions = new Set(s.expansions)
    expansions.add(key)
    set({ nodes: [...s.nodes, node], edges: [...s.edges, edge], expansions })

    const fill = (text: string, terms: string[]) =>
      set((st) => ({
        nodes: st.nodes.map((n) =>
          n.id === id ? { ...n, data: { ...n.data, text, terms, loading: false } } : n,
        ),
      }))

    contentSource
      .defineTerm(term)
      .then((c) => fill(c.text, c.terms))
      .catch(() => fill('Definition unavailable.', []))
  },

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),

  reset: () => {
    get().unsubscribe?.()
    set({
      nodes: [],
      edges: [],
      expansions: new Set<string>(),
      specialsOpened: new Set<SpecialKind>(),
      pending: {},
      status: 'idle',
      error: null,
      unsubscribe: null,
    })
  },
}))
