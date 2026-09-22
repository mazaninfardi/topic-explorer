import { beforeEach, describe, expect, it } from 'vitest'
import { ROOT_ID, useGraphStore } from '../graph/store'
import type { TGNodeData } from '../graph/types'

const rootData: TGNodeData = { kind: 'what', text: 'root', terms: ['foo'] }
const childData: TGNodeData = { kind: 'salient-term', text: 'foo def', terms: [] }

beforeEach(() => {
  useGraphStore.getState().setRoot(rootData)
})

describe('graph store', () => {
  it('seeds a single root What node', () => {
    const { nodes, edges } = useGraphStore.getState()
    expect(nodes).toHaveLength(1)
    expect(nodes[0].id).toBe(ROOT_ID)
    expect(edges).toHaveLength(0)
  })

  it('addChildNode adds a node and a connecting edge', () => {
    useGraphStore.getState().addChildNode(ROOT_ID, 'foo', childData)
    const { nodes, edges } = useGraphStore.getState()
    expect(nodes).toHaveLength(2)
    expect(edges).toHaveLength(1)
    expect(edges[0].source).toBe(ROOT_ID)
    expect(edges[0].target).toBe(nodes[1].id)
  })

  it('is a no-op when the same term is expanded twice from the same node', () => {
    const store = useGraphStore.getState()
    store.addChildNode(ROOT_ID, 'foo', childData)
    store.addChildNode(ROOT_ID, 'foo', childData)
    expect(useGraphStore.getState().nodes).toHaveLength(2)
  })

  it('ignores expansion from an unknown parent', () => {
    useGraphStore.getState().addChildNode('does-not-exist', 'foo', childData)
    expect(useGraphStore.getState().nodes).toHaveLength(1)
  })

  it('supports nesting to arbitrary depth (root -> child -> grandchild)', () => {
    const store = useGraphStore.getState()
    store.addChildNode(ROOT_ID, 'foo', { kind: 'salient-term', text: 'foo', terms: ['bar'] })
    const child = useGraphStore.getState().nodes[1]
    store.addChildNode(child.id, 'bar', { kind: 'salient-term', text: 'bar', terms: ['baz'] })
    const grandchild = useGraphStore.getState().nodes[2]
    store.addChildNode(grandchild.id, 'baz', { kind: 'salient-term', text: 'baz', terms: [] })

    const { nodes, edges } = useGraphStore.getState()
    expect(nodes).toHaveLength(4)
    expect(edges.map((e) => `${e.source}->${e.target}`)).toEqual([
      `${ROOT_ID}->${child.id}`,
      `${child.id}->${grandchild.id}`,
      `${grandchild.id}->${nodes[3].id}`,
    ])
  })
})
