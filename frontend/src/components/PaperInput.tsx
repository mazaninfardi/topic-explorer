import { useState } from 'react'
import { useGraphStore } from '../graph/store'
import { arxivIdOf } from '../lib/arxiv'

const SAMPLE = 'https://arxiv.org/abs/1512.03385'
type Mode = 'paper' | 'topic'

export function PaperInput() {
  const [mode, setMode] = useState<Mode>('paper')
  const [ref, setRef] = useState(SAMPLE)
  const [invalid, setInvalid] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const explore = useGraphStore((s) => s.explore)
  const exploreTopic = useGraphStore((s) => s.exploreTopic)
  const status = useGraphStore((s) => s.status)
  const error = useGraphStore((s) => s.error)
  const nodeCount = useGraphStore((s) => s.nodes.length)
  const isExample = useGraphStore((s) => s.isExample)
  const extracting = status === 'extracting'

  // A real, user-built graph is worth protecting from an accidental reset.
  const hasWork = status === 'ready' && !isExample && nodeCount > 1

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    setRef('')
    setInvalid(false)
  }

  const run = () => {
    const value = ref.trim()
    if (value) (mode === 'paper' ? explore : exploreTopic)(value)
    setConfirming(false)
  }

  const submit = () => {
    const value = ref.trim()
    if (!value) return
    if (mode === 'paper' && !arxivIdOf(value)) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    if (hasWork) setConfirming(true)
    else run()
  }

  const seg = (m: Mode, label: string) => (
    <button
      type="button"
      onClick={() => switchMode(m)}
      className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
        mode === m ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <div className="inline-flex rounded-lg bg-slate-100 p-0.5">
          {seg('paper', 'arXiv paper')}
          {seg('topic', 'Topic')}
        </div>
        <span className="text-xs text-slate-400">
          {mode === 'paper' ? 'Paste an arXiv link or ID' : 'Type anything — we explain it in plain language'}
        </span>
      </div>

      <div className="flex gap-2">
        <input
          id="paper"
          type="text"
          value={ref}
          onChange={(e) => {
            setRef(e.target.value)
            if (invalid) setInvalid(false)
          }}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder={mode === 'paper' ? 'https://arxiv.org/abs/1706.03762' : 'e.g. how do transformers work?'}
          className={`w-full rounded-md border p-2 text-sm text-slate-800 focus:outline-none focus:ring-1 ${
            invalid
              ? 'border-red-400 focus:border-red-500 focus:ring-red-500'
              : 'border-slate-300 focus:border-sky-500 focus:ring-sky-500'
          }`}
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

      {invalid && (
        <span className="text-sm text-red-600">
          That doesn’t look like an arXiv link. Try e.g. <code>arxiv.org/abs/1706.03762</code> — or switch to
          Topic.
        </span>
      )}

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
