import { useGraphStore, ROOT_ID } from '../graph/store'
import { listFamiliar, mostRecentTopic, upsertTopic, type StoredGraph } from './db'

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
  // Only persist a real, loaded exploration (not the transient loading root).
  if (!s.currentTopic || !root || root.data.loading) return
  clearTimeout(timer)
  timer = setTimeout(() => {
    const cur = useGraphStore.getState()
    if (!cur.currentTopic) return
    void upsertTopic({
      id: cur.currentTopic.id,
      title: cur.currentTopic.title,
      updatedAt: Date.now(),
      graph: serialize(),
    })
  }, 500)
}

/** Subscribe to the store and autosave the current topic (debounced). */
export function initPersistence(): () => void {
  return useGraphStore.subscribe(scheduleSave)
}

/** On app start: load familiar terms and restore the most recent topic. */
export async function restoreLast(): Promise<void> {
  const fam = await listFamiliar()
  useGraphStore.getState().setFamiliar(fam.map((f) => f.term))

  if (useGraphStore.getState().nodes.length > 0) return
  const rec = await mostRecentTopic()
  if (rec) useGraphStore.getState().loadTopic(rec)
}
