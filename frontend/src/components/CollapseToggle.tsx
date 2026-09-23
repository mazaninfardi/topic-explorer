import { useGraphStore } from '../graph/store'

/** A collapse/expand control shown only on nodes that have children. */
export function CollapseToggle({ id }: { id: string }) {
  const childCount = useGraphStore((s) => s.edges.filter((e) => e.source === id).length)
  const collapsed = useGraphStore((s) => s.collapsed.has(id))
  const toggleCollapse = useGraphStore((s) => s.toggleCollapse)

  if (childCount === 0) return null

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleCollapse(id)
      }}
      className="nodrag nopan rounded border border-slate-300 px-1.5 text-xs text-slate-500 hover:bg-slate-100"
      title={collapsed ? 'Expand' : 'Collapse'}
    >
      {collapsed ? `+${childCount}` : '−'}
    </button>
  )
}
