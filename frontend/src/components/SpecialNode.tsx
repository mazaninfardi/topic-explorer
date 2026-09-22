import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { TermText } from './TermText'

const STYLES = {
  why: { border: 'border-amber-400', label: 'text-amber-600' },
  how: { border: 'border-violet-400', label: 'text-violet-600' },
} as const

/** A Why or How special node opened from the What node. Carries salient terms. */
export function SpecialNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)
  const kind = data.kind === 'why' ? 'why' : 'how'
  const style = STYLES[kind]

  return (
    <div className={`max-w-sm rounded-xl border ${style.border} bg-white p-4 shadow-sm`}>
      <div className={`mb-1 text-xs font-semibold uppercase tracking-wide ${style.label}`}>
        {kind === 'why' ? 'Why' : 'How'}
      </div>
      <div className="text-sm leading-relaxed text-slate-700">
        <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
      </div>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
