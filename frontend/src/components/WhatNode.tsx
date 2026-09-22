import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore, type SpecialKind } from '../graph/store'
import { TermText } from './TermText'

/** Root node: the "What" headline, with Why/How actions and salient terms. */
export function WhatNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)
  const openSpecial = useGraphStore((s) => s.openSpecial)
  const pending = useGraphStore((s) => s.pending)
  const opened = useGraphStore((s) => s.specialsOpened)

  const action = (kind: SpecialKind, label: string) => {
    const ready = Boolean(pending[kind])
    const isOpen = opened.has(kind)
    return (
      <button
        type="button"
        disabled={!ready || isOpen}
        onClick={() => openSpecial(kind)}
        className="nodrag nopan rounded-md border border-sky-300 px-3 py-1 text-sm font-medium text-sky-700 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {label}
        {!ready ? ' …' : ''}
      </button>
    )
  }

  return (
    <div className="max-w-sm rounded-xl border-2 border-sky-500 bg-white p-4 shadow-md">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600">What</div>
      <div className="text-sm leading-relaxed text-slate-800">
        <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
      </div>
      <div className="mt-3 flex gap-2">
        {action('why', 'Why')}
        {action('how', 'How')}
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
