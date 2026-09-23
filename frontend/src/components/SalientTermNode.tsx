import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { TermText } from './TermText'
import { CollapseToggle } from './CollapseToggle'

function KnownButton({ nodeId, term, definition }: { nodeId: string; term: string; definition: string }) {
  const isFamiliar = useGraphStore((s) => s.familiar.has(term))
  const markKnown = useGraphStore((s) => s.markKnown)
  const toggleFamiliar = useGraphStore((s) => s.toggleFamiliar)

  if (isFamiliar) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleFamiliar(term)
        }}
        className="nodrag nopan rounded px-1 text-xs text-emerald-600 hover:bg-emerald-50"
        title="You marked this familiar — click to forget"
      >
        ✓ known
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        markKnown(nodeId, term, definition)
      }}
      className="nodrag nopan rounded border border-slate-300 px-1.5 text-xs text-slate-500 hover:bg-emerald-50 hover:text-emerald-700"
      title="Mark as known and hide this box"
    >
      I know this
    </button>
  )
}

/** A definition node for an expanded salient term. */
export function SalientTermNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)

  return (
    <div
      className={`max-w-xs rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-sm transition-all duration-200 ${
        data.removing ? 'scale-95 opacity-0' : 'opacity-100'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="truncate text-sm font-bold text-slate-900" title={data.term}>
          {data.term ?? 'Term'}
        </span>
        <div className="flex shrink-0 items-center gap-1">
          {data.term && !data.loading && <KnownButton nodeId={id} term={data.term} definition={data.text} />}
          <CollapseToggle id={id} />
        </div>
      </div>
      {data.loading ? (
        <div className="animate-pulse text-[13px] text-slate-400">Defining…</div>
      ) : (
        <p className="text-[13px] leading-relaxed text-slate-600">
          <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
        </p>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
