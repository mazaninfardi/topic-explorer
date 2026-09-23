import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { familiarKey, useGraphStore } from '../graph/store'
import { useJustAdded } from '../graph/useJustAdded'
import { TermText } from './TermText'
import { NodeControls } from './NodeControls'

function KnownButton({ nodeId, term, definition }: { nodeId: string; term: string; definition: string }) {
  const isKnown = useGraphStore((s) => s.familiar.has(familiarKey(term)))
  const markKnown = useGraphStore((s) => s.markKnown)
  const toggleFamiliar = useGraphStore((s) => s.toggleFamiliar)

  if (isKnown) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggleFamiliar(term)
        }}
        className="nodrag nopan rounded px-1.5 py-1 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
        title="You know this — click to forget"
      >
        Known ✓
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
      className="nodrag nopan rounded border border-slate-300 px-1.5 py-1 text-xs font-medium text-slate-500 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
      title="Mark as known — this hides the box"
    >
      Got it
    </button>
  )
}

/** A definition node for an expanded salient term. */
export function SalientTermNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)
  const flash = useJustAdded(id)

  return (
    <div
      className={`max-w-xs rounded-xl border border-slate-300 border-l-4 border-l-teal-400 bg-slate-50 p-4 shadow-sm transition-all duration-200 ${
        data.removing ? 'scale-95 opacity-0' : 'opacity-100'
      } ${flash ? 'tg-flash' : ''}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">Definition</span>
        <div className="flex shrink-0 items-center gap-1">
          {data.term && !data.loading && <KnownButton nodeId={id} term={data.term} definition={data.text} />}
          <NodeControls id={id} />
        </div>
      </div>
      {data.term && (
        <h3 className="mb-1 truncate text-sm font-bold text-slate-900" title={data.term}>
          {data.term.replace(/\b\w/g, (c) => c.toUpperCase())}
        </h3>
      )}
      {data.loading ? (
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
          Defining…
        </div>
      ) : (
        <p
          data-node-id={id}
          className="nowheel nodrag max-h-60 select-text overflow-y-auto text-[13px] leading-relaxed text-slate-600"
        >
          <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
        </p>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
