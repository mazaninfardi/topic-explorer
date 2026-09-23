import { create } from 'zustand'
import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { TGEdge, TGNode } from './types'
import { layoutGraph } from './layout'
import { contentSource } from '../content'
import { arxivIdOf } from '../lib/arxiv'
import { api, type TopicRecord } from '../lib/api'

export const ROOT_ID = 'root'
export type SpecialKind = 'why' | 'how'
export type ExtractStatus = 'idle' | 'extracting' | 'ready' | 'error'

let idCounter = 0
const nextId = () => `n${(idCounter += 1)}`
const expansionKey = (parentId: string, term: string) =>
  `${parentId}::${term.toLowerCase()}`

const ORIGIN = { x: 0, y: 0 }

/** Hide each node in `hiddenSet` together with its whole subtree, then re-flow. */
export function reflow(nodes: TGNode[], edges: TGEdge[], hiddenSet: Set<string>) {
  const childrenOf = new Map<string, string[]>()
  for (const e of edges) childrenOf.set(e.source, [...(childrenOf.get(e.source) ?? []), e.target])

  const hidden = new Set<string>()
  const visit = (id: string) => {
    for (const child of childrenOf.get(id) ?? []) if (!hidden.has(child)) { hidden.add(child); visit(child) }
  }
  for (const h of hiddenSet) {
    hidden.add(h)
    visit(h)
  }

  const nextNodes = nodes.map((n) => ({ ...n, hidden: hidden.has(n.id) }))
  const nextEdges = edges.map((e) => ({ ...e, hidden: hidden.has(e.source) || hidden.has(e.target) }))
  return { nodes: layoutGraph(nextNodes, nextEdges), edges: nextEdges }
}

interface GraphState {
  nodes: TGNode[]
  edges: TGEdge[]
  expansions: Set<string>
  specialsOpened: Set<SpecialKind>
  hidden: Set<string>
  familiar: Set<string>
  pending: { why?: { text: string; terms: string[] }; how?: { text: string; terms: string[] } }
  currentTopic: { id: string; title: string } | null
  status: ExtractStatus
  error: string | null
  needsSignIn: boolean
  unsubscribe: (() => void) | null

  explore: (ref: string) => void
  openSpecial: (kind: SpecialKind) => void
  expandTerm: (parentId: string, term: string) => void
  /** Hide a single node (and its subtree). */
  hideNode: (id: string) => void
  /** Restore the directly-hidden children of a node. */
  restoreChildren: (parentId: string) => void
  toggleFamiliar: (term: string, definition?: string) => void
  markKnown: (nodeId: string, term: string, definition: string) => void
  setFamiliar: (terms: string[]) => void
  loadTopic: (rec: TopicRecord) => void
  relayout: () => void
  onNodesChange: (changes: NodeChange<TGNode>[]) => void
  reset: () => void
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  nodes: [],
  edges: [],
  expansions: new Set<string>(),
  specialsOpened: new Set<SpecialKind>(),
  hidden: new Set<string>(),
  familiar: new Set<string>(),
  pending: {},
  currentTopic: null,
  status: 'idle',
  error: null,
  needsSignIn: false,
  unsubscribe: null,

  explore: (ref) => {
    get().reset()
    const id = arxivIdOf(ref) ?? ref.trim()
    const unsubscribe = contentSource.explore(ref, {
      onWhat: (c) =>
        set((s) => ({
          ...reflow(
            s.nodes.map((n) =>
              n.id === ROOT_ID
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      text: c.text,
                      terms: c.terms,
                      loading: false,
                      paperTitle: c.title ?? undefined,
                      paperUrl: c.url,
                    },
                  }
                : n,
            ),
            s.edges,
            s.hidden,
          ),
          status: 'ready',
          currentTopic: { id, title: c.title || c.text.slice(0, 60) },
        })),
      onWhy: (c) => set((s) => ({ pending: { ...s.pending, why: c } })),
      onHow: (c) => set((s) => ({ pending: { ...s.pending, how: c } })),
      onError: (message) =>
        message === 'guest-limit'
          ? set({
              status: 'error',
              error: 'You’ve reached the 5-paper limit for guests. Sign in to keep exploring.',
              needsSignIn: true,
              nodes: [],
              edges: [],
            })
          : set({ status: 'error', error: message, nodes: [], edges: [] }),
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
    set({ ...reflow([...s.nodes, node], edges, s.hidden), specialsOpened: opened })
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
    // Ensure the term is a salient term on its parent (so a user-selected
    // phrase becomes an underlined chip, familiar-marking, etc.).
    const parents = s.nodes.map((n) =>
      n.id === parentId && !n.data.terms.some((t) => t.toLowerCase() === term.toLowerCase())
        ? { ...n, data: { ...n.data, terms: [...n.data.terms, term] } }
        : n,
    )
    const edges = [...s.edges, { id: `e-${parentId}-${id}`, source: parentId, target: id }]
    const expansions = new Set(s.expansions)
    expansions.add(key)
    set({ ...reflow([...parents, node], edges, s.hidden), expansions })

    const fill = (text: string, terms: string[]) =>
      set((st) => ({
        ...reflow(
          st.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text, terms, loading: false } } : n)),
          st.edges,
          st.hidden,
        ),
      }))

    contentSource
      .defineTerm(term)
      .then((c) => fill(c.text, c.terms))
      .catch(() => fill('Definition unavailable.', []))
  },

  hideNode: (id) => {
    if (id === ROOT_ID) return
    const s = get()
    const hidden = new Set(s.hidden)
    hidden.add(id)
    set({ ...reflow(s.nodes, s.edges, hidden), hidden })
  },

  restoreChildren: (parentId) => {
    const s = get()
    const hidden = new Set(s.hidden)
    for (const e of s.edges) if (e.source === parentId) hidden.delete(e.target)
    set({ ...reflow(s.nodes, s.edges, hidden), hidden })
  },

  toggleFamiliar: (term, definition = '') => {
    const familiar = new Set(get().familiar)
    if (familiar.has(term)) {
      familiar.delete(term)
      void api.removeFamiliar(term).catch(() => {})
    } else {
      familiar.add(term)
      void api.addFamiliar(term, definition).catch(() => {})
    }
    set({ familiar })
  },

  markKnown: (nodeId, term, definition) => {
    const familiar = new Set(get().familiar)
    familiar.add(term)
    void api.addFamiliar(term, definition).catch(() => {})
    set((s) => ({
      familiar,
      nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, removing: true } } : n)),
    }))
    setTimeout(() => {
      const s = get()
      const remove = new Set<string>([nodeId])
      const childrenOf = new Map<string, string[]>()
      for (const e of s.edges) childrenOf.set(e.source, [...(childrenOf.get(e.source) ?? []), e.target])
      const visit = (id: string) => {
        for (const child of childrenOf.get(id) ?? []) if (!remove.has(child)) { remove.add(child); visit(child) }
      }
      visit(nodeId)
      // Drop the expansion keys of removed term nodes so they can be re-opened.
      const removedKeys = new Set<string>()
      for (const n of s.nodes) {
        if (!remove.has(n.id) || !n.data.term) continue
        const parentEdge = s.edges.find((e) => e.target === n.id)
        if (parentEdge) removedKeys.add(`${parentEdge.source}::${n.data.term.toLowerCase()}`)
      }
      const nodes = s.nodes.filter((n) => !remove.has(n.id))
      const edges = s.edges.filter((e) => !remove.has(e.source) && !remove.has(e.target))
      const expansions = new Set([...s.expansions].filter((k) => !removedKeys.has(k)))
      set({ ...reflow(nodes, edges, s.hidden), expansions })
    }, 260)
  },

  setFamiliar: (terms) => set({ familiar: new Set(terms) }),

  loadTopic: (rec) => {
    get().reset()
    const g = rec.graph
    const hidden = new Set(g.hidden ?? [])
    set({
      ...reflow(g.nodes as TGNode[], g.edges as TGEdge[], hidden),
      expansions: new Set(g.expansions),
      specialsOpened: new Set(g.specialsOpened as SpecialKind[]),
      hidden,
      pending: g.pending as GraphState['pending'],
      currentTopic: { id: rec.arxiv_id, title: rec.title },
      status: 'ready',
    })
  },

  relayout: () => set((s) => ({ ...reflow(s.nodes, s.edges, s.hidden) })),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),

  reset: () => {
    get().unsubscribe?.()
    set({
      nodes: [],
      edges: [],
      expansions: new Set<string>(),
      specialsOpened: new Set<SpecialKind>(),
      hidden: new Set<string>(),
      pending: {},
      currentTopic: null,
      status: 'idle',
      error: null,
      needsSignIn: false,
      unsubscribe: null,
      // `familiar` intentionally preserved across explorations.
    })
  },
}))
