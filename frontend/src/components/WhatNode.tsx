import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { contentSource } from '../content'
import { TermText } from './TermText'

/** Root node: the "What" headline. Exposes salient terms for exploration. */
export function WhatNode({ id, data }: NodeProps<TGNode>) {
  const addChildNode = useGraphStore((s) => s.addChildNode)

  return (
    <div className="max-w-xs rounded-xl border-2 border-sky-500 bg-white p-4 shadow-md">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
        What
      </div>
      <div className="text-sm leading-relaxed text-slate-800">
        <TermText
          text={data.text}
          terms={data.terms}
          onTermClick={(term) => addChildNode(id, term, contentSource.defineTerm(term))}
        />
      </div>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
