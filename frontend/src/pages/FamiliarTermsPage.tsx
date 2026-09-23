import { useGraphStore } from '../graph/store'

export function FamiliarTermsPage() {
  const familiar = useGraphStore((s) => s.familiar)
  const toggleFamiliar = useGraphStore((s) => s.toggleFamiliar)
  const terms = [...familiar].sort((a, b) => a.localeCompare(b))

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Familiar terms</h2>
      {terms.length === 0 ? (
        <p className="text-sm text-slate-500">
          None yet — mark a term as familiar (☆) in a term node to collect it here.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <li key={term} className="flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 py-1 pl-3 pr-1 text-sm text-amber-800">
              <span>{term}</span>
              <button
                type="button"
                onClick={() => toggleFamiliar(term)}
                className="rounded-full px-1.5 text-amber-500 hover:bg-amber-100"
                title="Unmark"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
