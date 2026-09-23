import { useGraphStore } from '../graph/store'

/** A star toggle to mark a salient term as "familiar". */
export function FamiliarToggle({ term }: { term: string }) {
  const isFamiliar = useGraphStore((s) => s.familiar.has(term))
  const toggleFamiliar = useGraphStore((s) => s.toggleFamiliar)

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        toggleFamiliar(term)
      }}
      className={`nodrag nopan rounded px-1 text-xs ${
        isFamiliar ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
      }`}
      title={isFamiliar ? 'Marked familiar' : 'Mark as familiar'}
    >
      {isFamiliar ? '★ familiar' : '☆ familiar'}
    </button>
  )
}
