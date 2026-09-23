import { create } from 'zustand'
import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { TGEdge, TGNode } from './types'
import { layoutGraph } from './layout'
import { contentSource } from '../content'
import { arxivIdOf } from '../lib/arxiv'
import { addFamiliar, removeFamiliar, type TopicRecord } from '../lib/db'

export const ROOT_ID = 'root'
export type SpecialKind = 'why' | 'how'
export type ExtractStatus = 'idle' | 'extracting' | 'ready' | 'error'

let idCounter = 0
const nextId = () => `n${(idCounter += 1)}`
const expansionKey = (parentId: string, term: string) =>
  `${parentId}::${term.toLowerCase()}`

const ORIGIN = { x: 0, y: 0 }

/** Compute descendant-of-collapsed hidden flags and re-flow the visible graph. */
export function reflow(nodes: TGNode[], edges: TGEdge[], collapsed: Set<string>) {
  const childrenOf = new Map<string, string[]>()
  for (const e of edges) {
    const arr = childrenOf.get(e.source) ?? []
    arr.push(e.target)
    childrenOf.set(e.source, arr)
  }
  const hidden = new Set<string>()
  const visit = (id: string) => {
    for (const child of childrenOf.get(id) ?? []) {
      if (!hidden.has(child)) {
        hidden.add(child)
        visit(child)
      }
    }
  }
  for (const c of collapsed) visit(c)

  const nextNodes = nodes.map((n) => ({ ...n, hidden: hidden.has(n.id) }))
  const nextEdges = edges.map((e) => ({ ...e, hidden: hidden.has(e.source) || hidden.has(e.target) }))
  return { nodes: layoutGraph(nextNodes, nextEdges), edges: nextEdges }
}

interface GraphState {
  nodes: TGNode[]
  edges: TGEdge[]
  expansions: Set<string>
  specialsOpened: Set<SpecialKind>
  collapsed: Set<string>
  familiar: Set<string>
  pending: { why?: { text: string; terms: string[] }; how?: { text: string; terms: string[] } }
  currentTopic: { id: string; title: string } | null
  status: ExtractStatus
  error: string | null
  unsubscribe: (() => void) | null

  explore: (ref: string) => void
  openSpecial: (kind: SpecialKind) => void
  expandTerm: (parentId: string, term: string) => void
  toggleCollapse: (id: string) => void
  toggleFamiliar: (term: string) => void
  setFamiliar: (terms: string[]) => void
  loadTopic: (rec: TopicRecord) => void
  onNodesChange: (changes: NodeChange<TGNode>[]) => void
  reset: () => void
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  nodes: [],
  edges: [],
  expansions: new Set<string>(),
  specialsOpened: new Set<SpecialKind>(),
  collapsed: new Set<string>(),
  familiar: new Set<string>(),
  pending: {},
  currentTopic: null,
  status: 'idle',
  error: null,
  unsubscribe: null,

  explore: (ref) => {
    get().reset()
    const id = arxivIdOf(ref) ?? ref.trim()
    const unsubscribe = contentSource.explore(ref, {
      onWhat: (c) =>
        set((s) => ({
          ...reflow(
            s.nodes.map((n) =>
              n.id === ROOT_ID ? { ...n, data: { ...n.data, text: c.text, terms: c.terms, loading: false } } : n,
            ),
            s.edges,
            s.collapsed,
          ),
          status: 'ready',
          currentTopic: { id, title: c.text.slice(0, 60) },
        })),
      onWhy: (c) => set((s) => ({ pending: { ...s.pending, why: c } })),
      onHow: (c) => set((s) => ({ pending: { ...s.pending, how: c } })),
      onError: (message) => set({ status: 'error', error: message, nodes: [], edges: [] }),
    })
    set({
      nodes: [{ id: ROOT_ID, type: 'what', position: ORIGIN, data: { kind: 'what', text: '', terms: [], loading: true } }],
      currentTopic: { id, title: ref },
      status: 'extracting',
      unsubscribe,
    })
  },

  openSpecial: (kind) => {
    const s = get()
    if (s.specialsOpened.has(kind)) return
    const content = s.pending[kind]
    if (!content || !s.nodes.some((n) => n.id === ROOT_ID)) return

    const id = nextId()
    const node: TGNode = { id, type: kind, position: ORIGIN, data: { kind, text: content.text, terms: content.terms } }
    const edges = [...s.edges, { id: `e-${ROOT_ID}-${id}`, source: ROOT_ID, target: id }]
    const opened = new Set(s.specialsOpened)
    opened.add(kind)
    set({ ...reflow([...s.nodes, node], edges, s.collapsed), specialsOpened: opened })
  },

  expandTerm: (parentId, term) => {
    const s = get()
    const key = expansionKey(parentId, term)
    if (s.expansions.has(key)) return
    if (!s.nodes.some((n) => n.id === parentId)) return

    const id = nextId()
    const node: TGNode = {
      id,
      type: 'salient-term',
      position: ORIGIN,
      data: { kind: 'salient-term', text: '', terms: [], term, loading: true },
    }
    const edges = [...s.edges, { id: `e-${parentId}-${id}`, source: parentId, target: id }]
    const expansions = new Set(s.expansions)
    expansions.add(key)
    set({ ...reflow([...s.nodes, node], edges, s.collapsed), expansions })

    const fill = (text: string, terms: string[]) =>
      set((st) => ({
        ...reflow(
          st.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text, terms, loading: false } } : n)),
          st.edges,
          st.collapsed,
        ),
      }))

    contentSource
      .defineTerm(term)
      .then((c) => fill(c.text, c.terms))
      .catch(() => fill('Definition unavailable.', []))
  },

  toggleCollapse: (id) => {
    const s = get()
    const collapsed = new Set(s.collapsed)
    if (collapsed.has(id)) collapsed.delete(id)
    else collapsed.add(id)
    set({ ...reflow(s.nodes, s.edges, collapsed), collapsed })
  },

  toggleFamiliar: (term) => {
    const familiar = new Set(get().familiar)
    if (familiar.has(term)) {
      familiar.delete(term)
      void removeFamiliar(term)
    } else {
      familiar.add(term)
      void addFamiliar(term)
    }
    set({ familiar })
  },

  setFamiliar: (terms) => set({ familiar: new Set(terms) }),

  loadTopic: (rec) => {
    get().reset()
    const g = rec.graph
    const collapsed = new Set(g.collapsed)
    set({
      ...reflow(g.nodes as TGNode[], g.edges as TGEdge[], collapsed),
      expansions: new Set(g.expansions),
      specialsOpened: new Set(g.specialsOpened as SpecialKind[]),
      collapsed,
      pending: g.pending as GraphState['pending'],
      currentTopic: { id: rec.id, title: rec.title },
      status: 'ready',
    })
  },

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),

  reset: () => {
    get().unsubscribe?.()
    set({
      nodes: [],
      edges: [],
      expansions: new Set<string>(),
      specialsOpened: new Set<SpecialKind>(),
      collapsed: new Set<string>(),
      pending: {},
      currentTopic: null,
      status: 'idle',
      error: null,
      unsubscribe: null,
      // `familiar` intentionally preserved across explorations.
    })
  },
}))
