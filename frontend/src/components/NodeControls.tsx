import { useGraphStore } from '../graph/store'
import { ROOT_ID } from '../graph/store'

/** Per-node controls: restore hidden children (+N) and hide this box (×). */
export function NodeControls({ id }: { id: string }) {
  const hiddenChildCount = useGraphStore(
    (s) => s.edges.filter((e) => e.source === id && s.hidden.has(e.target)).length,
  )
  const hideNode = useGraphStore((s) => s.hideNode)
  const restoreChildren = useGraphStore((s) => s.restoreChildren)

  return (
    <div className="flex items-center gap-1">
      {hiddenChildCount > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            restoreChildren(id)
          }}
          className="nodrag nopan rounded border border-slate-300 px-1.5 text-xs text-slate-500 hover:bg-slate-100"
          title={`Show ${hiddenChildCount} hidden`}
        >
          +{hiddenChildCount}
        </button>
      )}
      {id !== ROOT_ID && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            hideNode(id)
          }}
          className="nodrag nopan rounded px-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Hide this box"
        >
          ✕
        </button>
      )}
    </div>
  )
}
