import { useState } from 'react'
import { useGraphStore } from '../graph/store'

const SAMPLE = 'https://arxiv.org/abs/1512.03385'

export function PaperInput() {
  const [ref, setRef] = useState(SAMPLE)
  const [confirming, setConfirming] = useState(false)
  const explore = useGraphStore((s) => s.explore)
  const status = useGraphStore((s) => s.status)
  const error = useGraphStore((s) => s.error)
  const nodeCount = useGraphStore((s) => s.nodes.length)
  const isExample = useGraphStore((s) => s.isExample)
  const extracting = status === 'extracting'

  // A real, user-built graph is worth protecting from an accidental reset.
  const hasWork = status === 'ready' && !isExample && nodeCount > 1

  const run = () => {
    const value = ref.trim()
    if (value) explore(value)
    setConfirming(false)
  }

  const submit = () => {
    if (!ref.trim()) return
    if (hasWork) setConfirming(true)
    else run()
  }

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-white p-4">
      <label htmlFor="paper" className="text-sm font-medium text-slate-700">
        Explore a topic or paste an arXiv link
      </label>
      <div className="flex gap-2">
        <input
          id="paper"
          type="text"
          className="w-full rounded-md border border-slate-300 p-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="e.g. how do transformers work?  —  or  arxiv.org/abs/1706.03762"
        />
        <button
          type="button"
          onClick={submit}
          disabled={extracting}
          className="flex shrink-0 items-center gap-2 rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700 disabled:opacity-50"
        >
          {extracting && (
            <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
          )}
          {extracting ? 'Reading…' : 'Explore'}
        </button>
      </div>

      {confirming && (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <span>Start a new exploration? This replaces the current graph.</span>
          <button type="button" onClick={run} className="rounded bg-amber-600 px-2 py-0.5 font-medium text-white hover:bg-amber-700">
            Replace
          </button>
          <button type="button" onClick={() => setConfirming(false)} className="rounded px-2 py-0.5 font-medium text-amber-700 hover:bg-amber-100">
            Keep this
          </button>
        </div>
      )}

      {extracting && <span className="text-sm text-slate-500">Reading the paper — the summary appears as it&apos;s ready.</span>}
      {error && (
        <span className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</span>
      )}
    </div>
  )
}
