import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { TermText } from './TermText'
import { CollapseToggle } from './CollapseToggle'

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
      <div className="mb-1.5 flex items-center justify-between">
        <span className={`text-base font-bold ${style.label}`}>{kind === 'why' ? 'Why' : 'How'}</span>
        <CollapseToggle id={id} />
      </div>
      <p className="text-[13px] leading-relaxed text-slate-600">
        <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
      </p>
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
