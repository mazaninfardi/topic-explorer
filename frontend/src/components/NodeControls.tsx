import { useGraphStore } from '../graph/store'
import { ROOT_ID } from '../graph/store'

/** Eye icon — "reveal hidden". */
function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
      <path d="M1.5 10S4.5 4.5 10 4.5 18.5 10 18.5 10 15.5 15.5 10 15.5 1.5 10 1.5 10Z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  )
}

/** Chevron-up — "collapse this box". */
function CollapseIcon() {
  return (
    <svg viewBox="0 0 20 20" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 12.5 10 7.5l5 5" />
    </svg>
  )
}

/** Per-node controls: restore hidden children (Show N) and collapse this box. */
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
          className="nodrag nopan flex items-center gap-1 rounded border border-slate-300 px-1.5 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          title={`Show ${hiddenChildCount} hidden`}
        >
          <EyeIcon />
          Show {hiddenChildCount}
        </button>
      )}
      {id !== ROOT_ID && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            hideNode(id)
          }}
          className="nodrag nopan flex items-center justify-center rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          title="Collapse this box (reopen from its parent)"
        >
          <CollapseIcon />
        </button>
      )}
    </div>
  )
}
