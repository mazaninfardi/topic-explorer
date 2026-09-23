import { ROOT_ID, useGraphStore } from '../graph/store'
import { api, type StoredGraph } from './api'
import { useAuthStore } from './auth'

function serialize(): StoredGraph {
  const s = useGraphStore.getState()
  return {
    nodes: s.nodes,
    edges: s.edges,
    specialsOpened: [...s.specialsOpened],
    pending: s.pending,
    hidden: [...s.hidden],
  }
}

let timer: ReturnType<typeof setTimeout> | undefined

function scheduleSave() {
  if (!useAuthStore.getState().me?.authenticated) return // guests don't persist
  const s = useGraphStore.getState()
  const root = s.nodes.find((n) => n.id === ROOT_ID)
  if (!s.currentTopic || !root) return
  // Don't persist a mid-load graph (would restore a stuck "loading" box).
  if (s.nodes.some((n) => n.data.loading)) return
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

/** On app start (signed-in only): load familiar terms and restore the most recent topic. */
export async function restoreLast(): Promise<void> {
  if (!useAuthStore.getState().me?.authenticated) return // guests have no server data
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
