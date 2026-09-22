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

import { ROOT_ID, useGraphStore } from '../graph/store'

const start = (what = { text: 'What text with foo', terms: ['foo'] }) => {
  useGraphStore.getState().explore('1512.03385')
  h.handlers!.onWhat(what)
}

beforeEach(() => {
  useGraphStore.getState().reset()
  h.handlers = null
  h.defineTerm.mockClear()
})

describe('graph store', () => {
  it('seeds a single root What node when What streams in', () => {
    useGraphStore.getState().explore('x')
    expect(useGraphStore.getState().status).toBe('extracting')
    h.handlers!.onWhat({ text: 'W', terms: [] })
    const { nodes, status } = useGraphStore.getState()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].id).toBe(ROOT_ID)
    expect(status).toBe('ready')
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
})
