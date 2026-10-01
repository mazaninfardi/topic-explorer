import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useJustAdded } from '../graph/useJustAdded'
import { NodeControls } from './NodeControls'

/**
 * The paper's original abstract, shown verbatim. Read-only: no model-chosen
 * highlighted words and no complexity/ask controls (it isn't ours to rephrase).
 * Free-text selection still works via SelectionDefiner (the `data-node-id` host).
 */
export function AbstractNode({ id, data }: NodeProps<TGNode>) {
  const flash = useJustAdded(id)
  return (
    <div className={`max-w-sm rounded-xl border border-slate-300 border-l-4 border-l-slate-400 bg-white p-4 shadow-sm ${flash ? 'tg-flash' : ''}`}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Abstract · original</span>
        <NodeControls id={id} />
      </div>
      <p
        data-node-id={id}
        className="nowheel nodrag max-h-80 select-text overflow-y-auto text-[13px] leading-relaxed text-slate-600"
      >
        {data.text}
      </p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
