import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { TermText } from './TermText'

/**
 * A definition node for an expanded salient term. Shows a loading state until
 * its content arrives; has its own salient terms (so exploration nests) and no
 * Why/How actions.
 */
export function SalientTermNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)

  return (
    <div className="max-w-xs rounded-xl border border-slate-300 bg-slate-50 p-4 shadow-sm">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Term</div>
      {data.loading ? (
        <div className="animate-pulse text-sm text-slate-400">Defining…</div>
      ) : (
        <div className="text-sm leading-relaxed text-slate-700">
          <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
        </div>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
