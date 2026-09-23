import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

/** Serialized graph slice persisted per topic. */
export interface StoredGraph {
  nodes: unknown[]
  edges: unknown[]
  expansions: string[]
  specialsOpened: string[]
  pending: Record<string, unknown>
  collapsed: string[]
}

export interface TopicRecord {
  id: string
  title: string
  updatedAt: number
  graph: StoredGraph
}

export interface FamiliarRecord {
  term: string
  definition: string
  addedAt: number
}

interface TEDB extends DBSchema {
  topics: { key: string; value: TopicRecord; indexes: { updatedAt: number } }
  familiarTerms: { key: string; value: FamiliarRecord }
}

let dbPromise: Promise<IDBPDatabase<TEDB>> | null = null

function db(): Promise<IDBPDatabase<TEDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TEDB>('topic-explorer', 1, {
      upgrade(d) {
        const topics = d.createObjectStore('topics', { keyPath: 'id' })
        topics.createIndex('updatedAt', 'updatedAt')
        d.createObjectStore('familiarTerms', { keyPath: 'term' })
      },
    })
  }
  return dbPromise
}

// All calls are guarded: if IndexedDB is unavailable (private mode, etc.), the
// app keeps working in-memory.
async function guard<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

export const upsertTopic = (rec: TopicRecord) =>
  guard(async () => void (await db()).put('topics', rec), undefined)

export const getTopic = (id: string) =>
  guard(async () => (await db()).get('topics', id), undefined)

export const listTopics = () =>
  guard(async () => {
    const all = await (await db()).getAllFromIndex('topics', 'updatedAt')
    return all.reverse() // most recent first
  }, [] as TopicRecord[])

export const mostRecentTopic = () =>
  guard(async () => (await listTopics())[0], undefined)

export const addFamiliar = (term: string, definition = '') =>
  guard(
    async () => void (await db()).put('familiarTerms', { term, definition, addedAt: Date.now() }),
    undefined,
  )

export const removeFamiliar = (term: string) =>
  guard(async () => void (await db()).delete('familiarTerms', term), undefined)

export const listFamiliar = () =>
  guard(async () => {
    const all = await (await db()).getAll('familiarTerms')
    return all.sort((a, b) => b.addedAt - a.addedAt)
  }, [] as FamiliarRecord[])
