import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { contentSource } from '../content'
import { TermText } from './TermText'

/**
 * A definition node for an expanded salient term. It has its own salient
 * terms (so exploration nests) but deliberately no Why/How actions.
 */
export function SalientTermNode({ id, data }: NodeProps<TGNode>) {
  const addChildNode = useGraphStore((s) => s.addChildNode)

  return (
    <div className="max-w-xs rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Term
      </div>
      <div className="text-sm leading-relaxed text-slate-700">
        <TermText
          text={data.text}
          terms={data.terms}
          onTermClick={(term) => addChildNode(id, term, contentSource.defineTerm(term))}
        />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
