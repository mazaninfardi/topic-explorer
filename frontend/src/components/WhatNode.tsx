import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore, type SpecialKind } from '../graph/store'
import { TermText } from './TermText'
import { NodeControls } from './NodeControls'

/** Root node: the paper (title) with its What summary, Why/How, salient terms. */
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
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">What</span>
        <div className="flex items-center gap-2">
          {data.paperUrl && (
            <a
              href={data.paperUrl}
              target="_blank"
              rel="noreferrer"
              className="nodrag nopan text-xs text-sky-600 underline hover:text-sky-800"
            >
              full paper ↗
            </a>
          )}
          <NodeControls id={id} />
        </div>
      </div>

      {data.loading ? (
        <div className="animate-pulse text-sm text-slate-400">Reading the paper…</div>
      ) : (
        <>
          {data.paperTitle && (
            <h2 className="mb-1.5 text-base font-bold leading-snug text-slate-900">{data.paperTitle}</h2>
          )}
          <p data-node-id={id} className="nodrag select-text text-[13px] leading-relaxed text-slate-600">
            <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
          </p>
          <div className="mt-3 flex gap-2">
            {action('why', 'Why')}
            {action('how', 'How')}
          </div>
        </>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
