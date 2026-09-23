import { useEffect, useState } from 'react'
import { listFamiliar, type FamiliarRecord } from '../lib/db'
import { useGraphStore } from '../graph/store'

export function FamiliarTermsPage() {
  const [records, setRecords] = useState<FamiliarRecord[] | null>(null)
  const toggleFamiliar = useGraphStore((s) => s.toggleFamiliar)

  useEffect(() => {
    listFamiliar().then(setRecords)
  }, [])

  const forget = (term: string) => {
    toggleFamiliar(term) // removes from store + IndexedDB
    setRecords((rs) => (rs ? rs.filter((r) => r.term !== term) : rs))
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h2 className="mb-1 text-lg font-semibold text-slate-800">Familiar terms</h2>
      <p className="mb-4 text-sm text-slate-500">Terms you marked as known, with their definitions.</p>
      {records === null ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : records.length === 0 ? (
        <p className="text-sm text-slate-500">
          None yet — click “I know this” on a term box to collect it here.
        </p>
      ) : (
        <ul className="space-y-3">
          {records.map((r) => (
            <li key={r.term} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">{r.term}</h3>
                <button
                  type="button"
                  onClick={() => forget(r.term)}
                  className="shrink-0 rounded px-2 py-0.5 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  forget
                </button>
              </div>
              {r.definition && <p className="mt-1 text-[13px] leading-relaxed text-slate-600">{r.definition}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
