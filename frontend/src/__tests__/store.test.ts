import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ExploreHandlers } from '../content/ContentSource'

const h = vi.hoisted(() => ({
  handlers: null as ExploreHandlers | null,
  defineTerm: vi.fn(async () => ({ text: 'A definition.', terms: [] as string[] })),
}))

vi.mock('../content', () => ({
  contentSource: {
    explore: (_ref: string, handlers: ExploreHandlers) => {
      h.handlers = handlers
      return () => {}
    },
    defineTerm: h.defineTerm,
  },
}))

import { ROOT_ID, sanitizeEdges, useGraphStore } from '../graph/store'
import type { TGEdge, TGNode } from '../graph/types'

const node = (id: string, kind: TGNode['data']['kind']): TGNode =>
  ({ id, type: kind, position: { x: 0, y: 0 }, data: { kind, text: '', terms: [] } }) as TGNode
const edge = (source: string, target: string): TGEdge => ({ id: `e-${source}-${target}`, source, target })

const start = (what = { text: 'What text with foo', terms: ['foo'] }) => {
  useGraphStore.getState().explore('1512.03385')
  h.handlers!.onWhat(what)
}

beforeEach(() => {
  useGraphStore.getState().reset()
  useGraphStore.getState().setFamiliar([])
  h.handlers = null
  h.defineTerm.mockClear()
})

describe('graph store', () => {
  it('shows a loading root while extracting, then fills it when What arrives', () => {
    useGraphStore.getState().explore('x')
    let st = useGraphStore.getState()
    expect(st.status).toBe('extracting')
    expect(st.nodes).toHaveLength(1)
    expect(st.nodes[0].id).toBe(ROOT_ID)
    expect(st.nodes[0].data.loading).toBe(true)

    h.handlers!.onWhat({ text: 'W', terms: [] })
    st = useGraphStore.getState()
    expect(st.nodes).toHaveLength(1)
    expect(st.nodes[0].data.loading).toBe(false)
    expect(st.status).toBe('ready')
  })

  it('opens a single Why node from streamed content and dedupes', () => {
    start()
    h.handlers!.onWhy({ text: 'why text', terms: [] })
    useGraphStore.getState().openSpecial('why')
    useGraphStore.getState().openSpecial('why')
    const { nodes, edges } = useGraphStore.getState()
    expect(nodes.filter((n) => n.data.kind === 'why')).toHaveLength(1)
    expect(edges).toHaveLength(1)
  })

  it('does not open Why before its content has arrived', () => {
    start()
    useGraphStore.getState().openSpecial('why')
    expect(useGraphStore.getState().nodes.filter((n) => n.data.kind === 'why')).toHaveLength(0)
  })

  it('expands a term into a loading node, then fills it', async () => {
    start()
    useGraphStore.getState().expandTerm(ROOT_ID, 'foo')
    const child = useGraphStore.getState().nodes[1]
    expect(useGraphStore.getState().nodes).toHaveLength(2)
    expect(child.data.loading).toBe(true)
    await vi.waitFor(() => expect(useGraphStore.getState().nodes[1].data.loading).toBe(false))
    expect(useGraphStore.getState().nodes[1].data.text).toBe('A definition.')
  })

  it('dedupes a repeat term expansion from the same node', () => {
    start()
    useGraphStore.getState().expandTerm(ROOT_ID, 'foo')
    useGraphStore.getState().expandTerm(ROOT_ID, 'foo')
    expect(useGraphStore.getState().nodes).toHaveLength(2)
  })

  it('sets an error status when extraction fails', () => {
    useGraphStore.getState().explore('x')
    h.handlers!.onError('boom')
    expect(useGraphStore.getState().status).toBe('error')
    expect(useGraphStore.getState().error).toBe('boom')
  })

  it('hiding a node hides it (and subtree); restoreChildren brings it back', () => {
    start()
    useGraphStore.getState().expandTerm(ROOT_ID, 'foo')
    expect(useGraphStore.getState().nodes).toHaveLength(2)
    const childId = useGraphStore.getState().nodes.find((n) => n.id !== ROOT_ID)!.id

    useGraphStore.getState().hideNode(childId)
    expect(useGraphStore.getState().nodes.find((n) => n.id === childId)!.hidden).toBe(true)

    useGraphStore.getState().restoreChildren(ROOT_ID)
    expect(useGraphStore.getState().nodes.find((n) => n.id === childId)!.hidden).toBe(false)
  })

  it('toggleFamiliar flips membership', () => {
    useGraphStore.getState().toggleFamiliar('gradient')
    expect(useGraphStore.getState().familiar.has('gradient')).toBe(true)
    useGraphStore.getState().toggleFamiliar('gradient')
    expect(useGraphStore.getState().familiar.has('gradient')).toBe(false)
  })

  it('tracks the current topic id from the ref', () => {
    useGraphStore.getState().explore('https://arxiv.org/abs/1512.03385')
    expect(useGraphStore.getState().currentTopic?.id).toBe('1512.03385')
  })

  it('gives each exploration a fresh topicKey (fit-to-view cue)', () => {
    useGraphStore.getState().explore('1512.03385')
    const first = useGraphStore.getState().topicKey
    useGraphStore.getState().explore('1706.03762')
    expect(useGraphStore.getState().topicKey).not.toBe(first)
  })

  it('records the newly added node as lastAddedId (pan-to-node cue)', () => {
    start()
    useGraphStore.getState().expandTerm(ROOT_ID, 'foo')
    const child = useGraphStore.getState().nodes.find((n) => n.id !== ROOT_ID)!
    expect(useGraphStore.getState().lastAddedId).toBe(child.id)
  })

  it('after loading a saved graph, new nodes never collide with restored ids', () => {
    // A restored topic keeps ids like n5; the next created node must be n6+, not n1.
    useGraphStore.getState().loadTopic({
      arxiv_id: '1512.03385',
      title: 'ResNet',
      graph: {
        nodes: [
          { id: ROOT_ID, type: 'what', position: { x: 0, y: 0 }, data: { kind: 'what', text: 'W with foo', terms: ['foo'] } },
          { id: 'n5', type: 'how', position: { x: 0, y: 0 }, data: { kind: 'how', text: 'How body', terms: [] } },
        ],
        edges: [{ id: 'e-root-n5', source: ROOT_ID, target: 'n5' }],
        specialsOpened: ['how'],
        pending: {},
        hidden: [],
      },
    })
    useGraphStore.getState().expandTerm(ROOT_ID, 'foo')
    const ids = useGraphStore.getState().nodes.map((n) => n.id)
    expect(new Set(ids).size).toBe(ids.length) // no duplicate ids
    expect(ids).toContain('n5') // the How node survived
    expect(useGraphStore.getState().nodes.find((n) => n.id === 'n5')!.data.kind).toBe('how')
  })

  it('loadExample marks the graph as an example', () => {
    useGraphStore.getState().loadExample({
      arxiv_id: 'example',
      title: 'Demo',
      graph: {
        nodes: [{ id: ROOT_ID, type: 'what', position: { x: 0, y: 0 }, data: { kind: 'what', text: 'x', terms: [] } }],
        edges: [],
        specialsOpened: [],
        pending: {},
        hidden: [],
      },
    })
    expect(useGraphStore.getState().isExample).toBe(true)
    expect(useGraphStore.getState().status).toBe('ready')
  })
})

describe('sanitizeEdges (race/corruption repair)', () => {
  const nodes = [node(ROOT_ID, 'what'), node('n1', 'how'), node('n2', 'salient-term'), node('n6', 'salient-term')]

  it('repairs the exact corruption seen in the wild', () => {
    // duplicate root->how, spurious salient->how, self-loop, valid chain
    const corrupt = [
      edge(ROOT_ID, 'n1'),
      edge(ROOT_ID, 'n1'),
      edge(ROOT_ID, 'n2'),
      edge('n2', 'n1'),
      edge('n2', 'n2'),
      edge('n1', 'n6'),
    ]
    const clean = sanitizeEdges(nodes, corrupt).map((e) => e.id)
    expect(clean).toEqual(['e-root-n1', 'e-root-n2', 'e-n1-n6'])
  })

  it('drops self-loops and edges to missing nodes', () => {
    expect(sanitizeEdges(nodes, [edge('n2', 'n2'), edge(ROOT_ID, 'ghost')])).toEqual([])
  })

  it('keeps only one parent per node', () => {
    const clean = sanitizeEdges(nodes, [edge(ROOT_ID, 'n2'), edge('n6', 'n2')]).map((e) => e.id)
    expect(clean).toEqual(['e-root-n2'])
  })

  it('forces Why/How to be parented only by the root', () => {
    const clean = sanitizeEdges(nodes, [edge('n2', 'n1')]).map((e) => e.id)
    expect(clean).toEqual([])
  })
})
