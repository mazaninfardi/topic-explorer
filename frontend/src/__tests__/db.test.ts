import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import {
  addFamiliar,
  getTopic,
  listFamiliar,
  listTopics,
  removeFamiliar,
  upsertTopic,
  type StoredGraph,
} from '../lib/db'

const emptyGraph: StoredGraph = {
  nodes: [],
  edges: [],
  expansions: [],
  specialsOpened: [],
  pending: {},
  hidden: [],
}

describe('db topics', () => {
  it('round-trips topics, most recent first', async () => {
    await upsertTopic({ id: 'a', title: 'Alpha', updatedAt: 1, graph: emptyGraph })
    await upsertTopic({ id: 'b', title: 'Beta', updatedAt: 2, graph: emptyGraph })
    const list = await listTopics()
    expect(list.map((t) => t.id)).toEqual(['b', 'a'])
    expect((await getTopic('a'))?.title).toBe('Alpha')
  })
})

describe('db familiar terms', () => {
  it('adds and removes', async () => {
    await addFamiliar('entropy')
    expect((await listFamiliar()).map((f) => f.term)).toContain('entropy')
    await removeFamiliar('entropy')
    expect((await listFamiliar()).map((f) => f.term)).not.toContain('entropy')
  })
})
