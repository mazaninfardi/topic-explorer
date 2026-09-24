import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore, type SpecialKind } from '../graph/store'
import { useJustAdded } from '../graph/useJustAdded'
import { TermText } from './TermText'
import { NodeControls } from './NodeControls'
import { WhatSkeleton } from './WhatSkeleton'

const SPECIAL_BTN: Record<SpecialKind, string> = {
  why: 'border-amber-300 text-amber-700 hover:bg-amber-50',
  how: 'border-violet-300 text-violet-700 hover:bg-violet-50',
}

/** Root node: the paper (title) with its What summary, Why/How, salient terms. */
export function WhatNode({ id, data }: NodeProps<TGNode>) {
  const expandTerm = useGraphStore((s) => s.expandTerm)
  const openSpecial = useGraphStore((s) => s.openSpecial)
  const pending = useGraphStore((s) => s.pending)
  const setPaperPanel = useGraphStore((s) => s.setPaperPanel)
  const flash = useJustAdded(id)

  const action = (kind: SpecialKind, label: string) => {
    const ready = Boolean(pending[kind])
    return (
      <button
        type="button"
        disabled={!ready}
        onClick={() => openSpecial(kind)}
        className={`nodrag nopan rounded-md border px-3 py-1 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${SPECIAL_BTN[kind]}`}
      >
        {label}
        {!ready ? ' …' : ''}
      </button>
    )
  }

  return (
    <div
      className={`max-w-sm rounded-xl border-2 border-sky-500 bg-white p-4 shadow-md ${flash ? 'tg-flash' : ''}`}
    >
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600">{data.topic ? 'Topic' : 'What'}</span>
        <div className="flex items-center gap-2">
          {data.paperUrl && (
            <button
              type="button"
              onClick={() => setPaperPanel(data.paperUrl!)}
              title="Read the paper side-by-side"
              className="nodrag nopan text-xs text-sky-600 underline hover:text-sky-800"
            >
              read paper ⇥
            </button>
          )}
          <NodeControls id={id} />
        </div>
      </div>

      {data.loading ? (
        <WhatSkeleton />
      ) : (
        <>
          {data.topic
            ? data.term && (
                <h2 className="mb-1.5 text-base font-bold leading-snug text-slate-900">
                  {data.term.replace(/\b\w/g, (c) => c.toUpperCase())}
                </h2>
              )
            : data.paperTitle && (
                <h2 className="mb-1.5 text-base font-bold leading-snug text-slate-900">{data.paperTitle}</h2>
              )}
          <p
            data-node-id={id}
            className="nowheel nodrag max-h-72 select-text overflow-y-auto text-[13px] leading-relaxed text-slate-600"
          >
            <TermText text={data.text} terms={data.terms} onTermClick={(t) => expandTerm(id, t)} />
          </p>
          {!data.topic && (
            <div className="mt-3 flex gap-2">
              {action('why', 'Why')}
              {action('how', 'How')}
            </div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
