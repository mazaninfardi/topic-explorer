import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { useJustAdded } from '../graph/useJustAdded'
import { TermText } from './TermText'
import { NodeControls } from './NodeControls'
import { BoxTools } from './BoxTools'

/** A custom question (signed-in) and its plain-language answer, as a child box. */
export function QaNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)
  const flash = useJustAdded(id)

  return (
    <div className={`max-w-xs rounded-xl border border-slate-300 border-l-4 border-l-rose-400 bg-white p-4 shadow-sm ${flash ? 'tg-flash' : ''}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Your question</span>
        <NodeControls id={id} />
      </div>
      {data.question && (
        <h3 className="mb-1.5 text-sm font-semibold leading-snug text-slate-900">{data.question}</h3>
      )}
      {data.loading ? (
        <div className="flex items-center gap-2 text-[13px] text-slate-400">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-500" />
          Thinking…
        </div>
      ) : (
        <>
          <p
            data-node-id={id}
            className="nowheel nodrag max-h-60 select-text overflow-y-auto text-[13px] leading-relaxed text-slate-600"
          >
            <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
          </p>
          <BoxTools nodeId={id} level={data.complexity} busy={data.rephrasing} />
        </>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
