import { useState } from 'react'
import { useGraphStore } from '../graph/store'
import { useAuthStore } from '../lib/auth'
import type { ComplexityLevel } from '../graph/types'

const LEVELS: { key: ComplexityLevel; label: string; title: string }[] = [
  { key: 'simpler', label: 'Simpler', title: 'Explain this more simply' },
  { key: 'standard', label: 'Standard', title: 'The default explanation' },
  { key: 'technical', label: 'Technical', title: 'Explain this more technically' },
]

/** The Simpler / Standard / Technical control for a generated box. */
function ComplexityControl({ nodeId, level, busy }: { nodeId: string; level: ComplexityLevel; busy: boolean }) {
  const setComplexity = useGraphStore((s) => s.setComplexity)
  return (
    <div className="nodrag nopan inline-flex items-center overflow-hidden rounded-md border border-slate-200">
      {LEVELS.map((l) => {
        const active = l.key === level
        return (
          <button
            key={l.key}
            type="button"
            title={l.title}
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation()
              setComplexity(nodeId, l.key)
            }}
            className={`px-1.5 py-0.5 text-[10px] font-medium transition-colors disabled:opacity-50 ${
              active ? 'bg-sky-100 text-sky-700' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            {l.label}
          </button>
        )
      })}
      {busy && (
        <span className="mx-1 inline-block h-2.5 w-2.5 animate-spin rounded-full border-2 border-slate-300 border-t-sky-500" />
      )}
    </div>
  )
}

/** The "Ask a follow-up" affordance. Only rendered for signed-in users (BoxTools gates). */
function AskBox({ parentId }: { parentId: string }) {
  const askQuestion = useGraphStore((s) => s.askQuestion)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')

  if (!open) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="nodrag nopan rounded-md border border-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700"
      >
        Ask ↳
      </button>
    )
  }

  const submit = () => {
    const t = q.trim()
    if (!t) return
    askQuestion(parentId, t)
    setQ('')
    setOpen(false)
  }

  return (
    <div className="nodrag nopan flex w-full items-center gap-1">
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
          else if (e.key === 'Escape') setOpen(false)
        }}
        placeholder="Ask a follow-up…"
        className="min-w-0 flex-1 rounded border border-slate-300 px-1.5 py-0.5 text-[11px] focus:border-sky-400 focus:outline-none"
      />
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          submit()
        }}
        className="rounded bg-sky-600 px-1.5 py-0.5 text-[10px] font-medium text-white hover:bg-sky-700"
      >
        Ask
      </button>
    </div>
  )
}

/** Footer controls shared by every generated box: complexity + ask.
 * Signed-in only — these are costly, gated features; guests see nothing. */
export function BoxTools({ nodeId, level, busy }: { nodeId: string; level?: ComplexityLevel; busy?: boolean }) {
  const signedIn = useAuthStore((s) => s.me?.authenticated)
  if (!signedIn) return null
  return (
    <div className="mt-2.5 flex flex-wrap items-center justify-between gap-1.5 border-t border-slate-100 pt-2">
      <ComplexityControl nodeId={nodeId} level={level ?? 'standard'} busy={Boolean(busy)} />
      <AskBox parentId={nodeId} />
    </div>
  )
}
