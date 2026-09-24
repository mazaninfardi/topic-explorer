import { create } from 'zustand'
import { applyNodeChanges, type NodeChange } from '@xyflow/react'
import type { TGEdge, TGNode } from './types'
import { layoutGraph } from './layout'
import { contentSource } from '../content'
import { arxivIdOf } from '../lib/arxiv'
import { api, type TopicRecord } from '../lib/api'
import { useAuthStore } from '../lib/auth'

const canPersist = () => Boolean(useAuthStore.getState().me?.authenticated)

export const ROOT_ID = 'root'
export type SpecialKind = 'why' | 'how'
export type ExtractStatus = 'idle' | 'extracting' | 'ready' | 'error'

let topicNonce = 0
/** A fresh key each time a whole new graph is shown, so the canvas fits once. */
const newTopicKey = () => `k${(topicNonce += 1)}`

/**
 * Deterministic, collision-free node ids. Terms are unique (deduped by
 * `termKey`), so a term's id is its canonical key — bijective with dedup, and
 * stable across sessions/reloads. Specials get their kind; the root is ROOT_ID.
 * This removes the whole class of id-collision bugs a session-local counter had
 * (a restored graph's `n5` vs. a freshly minted `n5`).
 */
const termNodeId = (term: string) => `term:${termKey(term)}`

const ORIGIN = { x: 0, y: 0 }

/** Canonical key for a term: lowercased + naive singularization (plural≈singular). */
export function termKey(term: string): string {
  const k = term.trim().toLowerCase()
  return k.length > 3 && k.endsWith('s') && !k.endsWith('ss') ? k.slice(0, -1) : k
}

export const familiarKey = (term: string) => term.trim().toLowerCase()

/**
 * Repair the edge set so a race (or an old saved graph) can't leave it
 * inconsistent: no self-loops, no duplicates, at most one parent per node,
 * Why/How parented only by the root, and no edges to/from missing nodes.
 */
export function sanitizeEdges(nodes: TGNode[], edges: TGEdge[]): TGEdge[] {
  const ids = new Set(nodes.map((n) => n.id))
  const kindOf = new Map(nodes.map((n) => [n.id, n.data.kind]))
  const parentChosen = new Set<string>()
  const out: TGEdge[] = []
  for (const e of edges) {
    if (e.source === e.target) continue
    if (!ids.has(e.source) || !ids.has(e.target)) continue
    const targetKind = kindOf.get(e.target)
    if ((targetKind === 'why' || targetKind === 'how') && e.source !== ROOT_ID) continue
    if (parentChosen.has(e.target)) continue // one parent per node (keep first valid)
    parentChosen.add(e.target)
    out.push({ ...e, id: `e-${e.source}-${e.target}` })
  }
  return out
}

function childrenMap(edges: TGEdge[]): Map<string, string[]> {
  const m = new Map<string, string[]>()
  for (const e of edges) m.set(e.source, [...(m.get(e.source) ?? []), e.target])
  return m
}

/** Node ids reachable from `start` (its subtree), excluding `start` itself. */
function reachableFrom(start: string, children: Map<string, string[]>): Set<string> {
  const out = new Set<string>()
  const stack = [...(children.get(start) ?? [])]
  for (let n = stack.pop(); n !== undefined; n = stack.pop()) {
    if (out.has(n)) continue
    out.add(n)
    for (const c of children.get(n) ?? []) stack.push(c)
  }
  return out
}

/** Node ids reachable from `id` (its subtree). */
function descendantsOf(id: string, edges: TGEdge[]): Set<string> {
  return reachableFrom(id, childrenMap(edges))
}

/** Hide each node in `hiddenSet` together with its whole subtree, then re-flow. */
export function reflow(nodes: TGNode[], edges: TGEdge[], hiddenSet: Set<string>) {
  edges = sanitizeEdges(nodes, edges)
  const children = childrenMap(edges)
  const hidden = new Set<string>()
  for (const h of hiddenSet) {
    hidden.add(h)
    for (const d of reachableFrom(h, children)) hidden.add(d)
  }
  const nextNodes = nodes.map((n) => ({ ...n, hidden: hidden.has(n.id) }))
  const nextEdges = edges.map((e) => ({ ...e, hidden: hidden.has(e.source) || hidden.has(e.target) }))
  return { nodes: layoutGraph(nextNodes, nextEdges), edges: nextEdges }
}

interface GraphState {
  nodes: TGNode[]
  edges: TGEdge[]
  specialsOpened: Set<SpecialKind>
  hidden: Set<string>
  familiar: Set<string>
  pending: { why?: { text: string; terms: string[] }; how?: { text: string; terms: string[] } }
  currentTopic: { id: string; title: string } | null
  status: ExtractStatus
  error: string | null
  unsubscribe: (() => void) | null
  /** Changes when a whole new graph is shown (explore/load/example) — the cue to fit-to-view once. */
  topicKey: string
  /** Id of the most recently created or revealed node — the cue to pan it into view. */
  lastAddedId: string | null
  /** True while the pre-built onboarding example graph is showing (not a real exploration). */
  isExample: boolean
  /** arXiv abstract URL of the paper shown in the side-by-side panel, or null when closed. */
  paperPanelUrl: string | null

  explore: (ref: string) => void
  loadExample: (rec: TopicRecord) => void
  setPaperPanel: (url: string | null) => void
  openSpecial: (kind: SpecialKind) => void
  expandTerm: (parentId: string, term: string) => void
  hideNode: (id: string) => void
  restoreChildren: (parentId: string) => void
  toggleFamiliar: (term: string, definition?: string) => void
  markKnown: (nodeId: string, term: string, definition: string) => void
  setFamiliar: (terms: string[]) => void
  loadTopic: (rec: TopicRecord) => void
  relayout: () => void
  onNodesChange: (changes: NodeChange<TGNode>[]) => void
  reset: () => void
}

const DEFINE_TIMEOUT_MS = 30000

/** The state patch for showing a whole stored graph (a saved topic or the example). */
function recordToState(rec: TopicRecord, isExample: boolean) {
  const g = rec.graph
  const hidden = new Set(g.hidden ?? [])
  return {
    ...reflow(g.nodes as TGNode[], g.edges as TGEdge[], hidden),
    specialsOpened: new Set(g.specialsOpened as SpecialKind[]),
    hidden,
    pending: g.pending as GraphState['pending'],
    currentTopic: { id: rec.arxiv_id, title: rec.title },
    status: 'ready' as const,
    topicKey: newTopicKey(),
    lastAddedId: null,
    isExample,
  }
}

export const useGraphStore = create<GraphState>()((set, get) => ({
  nodes: [],
  edges: [],
  specialsOpened: new Set<SpecialKind>(),
  hidden: new Set<string>(),
  familiar: new Set<string>(),
  pending: {},
  currentTopic: null,
  status: 'idle',
  error: null,
  unsubscribe: null,
  topicKey: 'empty',
  lastAddedId: null,
  isExample: false,
  paperPanelUrl: null,

  explore: (ref) => {
    get().reset()
    const id = arxivIdOf(ref) ?? ref.trim()
    const unsubscribe = contentSource.explore(ref, {
      onWhat: (c) => {
        set((s) => ({
          ...reflow(
            s.nodes.map((n) =>
              n.id === ROOT_ID
                ? { ...n, data: { ...n.data, text: c.text, terms: c.terms, loading: false, paperTitle: c.title ?? undefined, paperUrl: c.url } }
                : n,
            ),
            s.edges,
            s.hidden,
          ),
          status: 'ready',
          currentTopic: { id, title: c.title || c.text.slice(0, 60) },
        }))
        // A guest's remaining-paper count just changed server-side — refresh it.
        void useAuthStore.getState().load()
      },
      onWhy: (c) => set((s) => ({ pending: { ...s.pending, why: c } })),
      onHow: (c) => set((s) => ({ pending: { ...s.pending, how: c } })),
      onError: (message) =>
        message === 'guest-limit'
          ? set({ status: 'error', error: 'You’ve reached the 5-paper limit for guests. Sign in to keep exploring.', nodes: [], edges: [] })
          : set({ status: 'error', error: message, nodes: [], edges: [] }),
    })
    set({
      nodes: [{ id: ROOT_ID, type: 'what', position: ORIGIN, data: { kind: 'what', text: '', terms: [], loading: true } }],
      currentTopic: { id, title: ref },
      status: 'extracting',
      unsubscribe,
      topicKey: newTopicKey(),
      lastAddedId: null,
      isExample: false,
    })
  },

  loadExample: (rec) => {
    get().reset()
    set(recordToState(rec, true))
  },

  setPaperPanel: (url) => set({ paperPanelUrl: url }),

  openSpecial: (kind) => {
    const s = get()
    const content = s.pending[kind]
    if (!content || !s.nodes.some((n) => n.id === ROOT_ID)) return

    // Reopen an existing (possibly hidden) special node instead of refetching.
    const existing = s.nodes.find((n) => n.data.kind === kind)
    if (existing) {
      if (!s.hidden.has(existing.id)) return
      const hidden = new Set(s.hidden)
      hidden.delete(existing.id)
      set({ ...reflow(s.nodes, s.edges, hidden), hidden, lastAddedId: existing.id })
      return
    }

    const id = kind
    const node: TGNode = { id, type: kind, position: ORIGIN, data: { kind, text: content.text, terms: content.terms } }
    const edges = [...s.edges, { id: `e-${ROOT_ID}-${id}`, source: ROOT_ID, target: id }]
    const opened = new Set(s.specialsOpened)
    opened.add(kind)
    set({ ...reflow([...s.nodes, node], edges, s.hidden), specialsOpened: opened, lastAddedId: id })
  },

  expandTerm: (parentId, term) => {
    const s = get()
    if (!s.nodes.some((n) => n.id === parentId)) return
    const key = termKey(term)

    const withTermChip = (nodes: TGNode[]) =>
      nodes.map((n) =>
        n.id === parentId && !n.data.terms.some((t) => t.toLowerCase() === term.toLowerCase())
          ? { ...n, data: { ...n.data, terms: [...n.data.terms, term] } }
          : n,
      )

    // A term has ONE definition node. If it exists, reveal it and link it
    // directly to the current parent (one hop), unless that would cycle.
    const existing = s.nodes.find((n) => n.data.kind === 'salient-term' && n.data.term && termKey(n.data.term) === key)
    if (existing && existing.id !== parentId) {
      const nodes = withTermChip(s.nodes)
      const hidden = new Set(s.hidden)
      hidden.delete(existing.id)
      if (descendantsOf(existing.id, s.edges).has(parentId)) {
        // Would create a cycle — just reveal it in place.
        set({ ...reflow(nodes, s.edges, hidden), hidden, lastAddedId: existing.id })
        return
      }
      const edges = s.edges.filter((e) => e.target !== existing.id)
      edges.push({ id: `e-${parentId}-${existing.id}`, source: parentId, target: existing.id })
      set({ ...reflow(nodes, edges, hidden), hidden, lastAddedId: existing.id })
      return
    }
    if (existing) return

    const id = termNodeId(term)
    const node: TGNode = { id, type: 'salient-term', position: ORIGIN, data: { kind: 'salient-term', text: '', terms: [], term, loading: true } }
    const edges = [...s.edges, { id: `e-${parentId}-${id}`, source: parentId, target: id }]
    set({ ...reflow([...withTermChip(s.nodes), node], edges, s.hidden), lastAddedId: id })

    const fill = (text: string, terms: string[]) =>
      set((st) => ({
        ...reflow(
          st.nodes.map((n) => (n.id === id ? { ...n, data: { ...n.data, text, terms, loading: false } } : n)),
          st.edges,
          st.hidden,
        ),
      }))

    let timer: ReturnType<typeof setTimeout> | undefined
    Promise.race([
      contentSource.defineTerm(term),
      new Promise<never>((_, rej) => {
        timer = setTimeout(() => rej(new Error('timeout')), DEFINE_TIMEOUT_MS)
      }),
    ])
      .then((c) => fill(c.text, c.terms))
      .catch(() => fill('Definition unavailable — click the term again to retry.', []))
      .finally(() => clearTimeout(timer))
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
    const k = familiarKey(term)
    const familiar = new Set(get().familiar)
    if (familiar.has(k)) {
      familiar.delete(k)
      if (canPersist()) void api.removeFamiliar(term).catch(() => {})
    } else {
      familiar.add(k)
      if (canPersist()) void api.addFamiliar(term, definition).catch(() => {})
    }
    set({ familiar })
  },

  markKnown: (nodeId, term, definition) => {
    const familiar = new Set(get().familiar)
    familiar.add(familiarKey(term))
    if (canPersist()) void api.addFamiliar(term, definition).catch(() => {})
    set((s) => ({ familiar, nodes: s.nodes.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, removing: true } } : n)) }))
    setTimeout(() => {
      const s = get()
      const remove = descendantsOf(nodeId, s.edges)
      remove.add(nodeId)
      const nodes = s.nodes.filter((n) => !remove.has(n.id))
      const edges = s.edges.filter((e) => !remove.has(e.source) && !remove.has(e.target))
      set({ ...reflow(nodes, edges, s.hidden) })
    }, 260)
  },

  setFamiliar: (terms) => set({ familiar: new Set(terms.map(familiarKey)) }),

  loadTopic: (rec) => {
    get().reset()
    set(recordToState(rec, false))
  },

  relayout: () => set((s) => ({ ...reflow(s.nodes, s.edges, s.hidden) })),

  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),

  reset: () => {
    get().unsubscribe?.()
    set({
      nodes: [],
      edges: [],
      specialsOpened: new Set<SpecialKind>(),
      hidden: new Set<string>(),
      pending: {},
      currentTopic: null,
      status: 'idle',
      error: null,
      unsubscribe: null,
      lastAddedId: null,
      isExample: false,
      paperPanelUrl: null,
      // `familiar` and `topicKey` intentionally preserved across explorations.
    })
  },
}))
