import { useState } from 'react'
import { useGraphStore } from '../graph/store'

const SAMPLE = 'https://arxiv.org/abs/1512.03385'

export function PaperInput() {
  const [ref, setRef] = useState(SAMPLE)
  const explore = useGraphStore((s) => s.explore)
  const status = useGraphStore((s) => s.status)
  const error = useGraphStore((s) => s.error)
  const extracting = status === 'extracting'

  const submit = () => {
    const value = ref.trim()
    if (value) explore(value)
  }

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-white p-4">
      <label htmlFor="paper" className="text-sm font-medium text-slate-700">
        Paste an arXiv link to explore
      </label>
      <div className="flex gap-2">
        <input
          id="paper"
          type="text"
          className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="https://arxiv.org/abs/1706.03762"
        />
        <button
          type="button"
          onClick={submit}
          disabled={extracting}
          className="shrink-0 rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {extracting ? 'Extracting…' : 'Explore'}
        </button>
      </div>
      {extracting && (
        <span className="text-sm text-slate-500">Fetching and reading the paper… (can take up to ~90s)</span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  )
}
