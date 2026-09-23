import { ROOT_ID, useGraphStore } from '../graph/store'
import { api, type StoredGraph } from './api'

function serialize(): StoredGraph {
  const s = useGraphStore.getState()
  return {
    nodes: s.nodes,
    edges: s.edges,
    expansions: [...s.expansions],
    specialsOpened: [...s.specialsOpened],
    pending: s.pending,
    hidden: [...s.hidden],
  }
}

let timer: ReturnType<typeof setTimeout> | undefined

function scheduleSave() {
  const s = useGraphStore.getState()
  const root = s.nodes.find((n) => n.id === ROOT_ID)
  if (!s.currentTopic || !root || root.data.loading) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    const cur = useGraphStore.getState()
    if (!cur.currentTopic) return
    api.putTopic(cur.currentTopic.id, cur.currentTopic.title, serialize()).catch(() => {})
  }, 500)
}

/** Subscribe to the store and autosave the current topic to the server (debounced). */
export function initPersistence(): () => void {
  return useGraphStore.subscribe(scheduleSave)
}

/** On app start: load familiar terms and restore the most recent topic from the server. */
export async function restoreLast(): Promise<void> {
  try {
    const fam = await api.listFamiliar()
    useGraphStore.getState().setFamiliar(fam.map((f) => f.term))
  } catch {
    /* ignore */
  }
  if (useGraphStore.getState().nodes.length > 0) return
  try {
    const topics = await api.listTopics()
    if (topics[0]) useGraphStore.getState().loadTopic(topics[0])
  } catch {
    /* ignore */
  }
}
