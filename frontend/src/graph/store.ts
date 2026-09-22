import { create } from 'zustand'
import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { TGEdge, TGNode } from './types'
import { layoutGraph } from './layout'
import { contentSource } from '../content'

export const ROOT_ID = 'root'
export type SpecialKind = 'why' | 'how'
export type ExtractStatus = 'idle' | 'extracting' | 'ready' | 'error'

let idCounter = 0
const nextId = () => `n${(idCounter += 1)}`
const expansionKey = (parentId: string, term: string) =>
  `${parentId}::${term.toLowerCase()}`

const ORIGIN = { x: 0, y: 0 }

interface GraphState {
  nodes: TGNode[]
  edges: TGEdge[]
  expansions: Set<string>
  specialsOpened: Set<SpecialKind>
  pending: { why?: { text: string; terms: string[] }; how?: { text: string; terms: string[] } }
  status: ExtractStatus
  error: string | null
  unsubscribe: (() => void) | null

  explore: (ref: string) => void
  openSpecial: (kind: SpecialKind) => void
  expandTerm: (parentId: string, term: string) => void
  onNodesChange: (changes: NodeChange<TGNode>[]) => void
  reset: () => void
}

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
        set((s) => ({
          nodes: layoutGraph(
            s.nodes.map((n) =>
              n.id === ROOT_ID ? { ...n, data: { ...n.data, text: c.text, terms: c.terms, loading: false } } : n,
            ),
            s.edges,
          ),
          status: 'ready',
        })),
      onWhy: (c) => set((s) => ({ pending: { ...s.pending, why: c } })),
      onHow: (c) => set((s) => ({ pending: { ...s.pending, how: c } })),
      onError: (message) => set({ status: 'error', error: message, nodes: [], edges: [] }),
    })
    set({
      nodes: [{ id: ROOT_ID, type: 'what', position: ORIGIN, data: { kind: 'what', text: '', terms: [], loading: true } }],
      status: 'extracting',
      unsubscribe,
    })
  },

  openSpecial: (kind) => {
    const s = get()
    if (s.specialsOpened.has(kind)) return
    const content = s.pending[kind]
    const root = s.nodes.find((n) => n.id === ROOT_ID)
    if (!content || !root) return

    const id = nextId()
    const node: TGNode = { id, type: kind, position: ORIGIN, data: { kind, text: content.text, terms: content.terms } }
    const edges = [...s.edges, { id: `e-${ROOT_ID}-${id}`, source: ROOT_ID, target: id }]
    const opened = new Set(s.specialsOpened)
    opened.add(kind)
    set({ nodes: layoutGraph([...s.nodes, node], edges), edges, specialsOpened: opened })
  },

  expandTerm: (parentId, term) => {
    const s = get()
    const key = expansionKey(parentId, term)
    if (s.expansions.has(key)) return
    if (!s.nodes.some((n) => n.id === parentId)) return

    const id = nextId()
    const node: TGNode = { id, type: 'salient-term', position: ORIGIN, data: { kind: 'salient-term', text: '', terms: [], loading: true } }
    const edges = [...s.edges, { id: `e-${parentId}-${id}`, source: parentId, target: id }]
    const expansions = new Set(s.expansions)
    expansions.add(key)
    set({ nodes: layoutGraph([...s.nodes, node], edges), edges, expansions })

    const fill = (text: string, terms: string[]) =>
      set((st) => ({
        nodes: layoutGraph(
          st.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text, terms, loading: false } } : n)),
          st.edges,
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
