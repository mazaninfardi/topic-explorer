import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { TGNode } from '../graph/types'
import { useGraphStore } from '../graph/store'
import { useJustAdded } from '../graph/useJustAdded'
import { NodeControls } from './NodeControls'

/** A gallery of the paper's figures — one at a time, paged within this one box. */
export function FiguresNode({ id, data }: NodeProps<TGNode>) {
  const setFigureIndex = useGraphStore((s) => s.setFigureIndex)
  const flash = useJustAdded(id)
  const items = data.items ?? []
  const current = Math.min(data.current ?? 0, Math.max(0, items.length - 1))
  const fig = items[current]

  return (
    <div className={`w-72 rounded-xl border border-slate-300 border-l-4 border-l-cyan-500 bg-white p-4 shadow-sm ${flash ? 'tg-flash' : ''}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700">
          Figures{items.length > 0 ? ` · ${current + 1} / ${items.length}` : ''}
        </span>
        <NodeControls id={id} />
      </div>

      {data.loading ? (
        <div className="flex items-center gap-2 py-6 text-[13px] text-slate-400">
          <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-slate-300 border-t-cyan-500" />
          Pulling figures from the paper…
        </div>
      ) : items.length === 0 ? (
        <p className="py-4 text-[13px] leading-relaxed text-slate-500">
          {data.text || 'No figures found in this paper.'}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous figure"
              onClick={(e) => {
                e.stopPropagation()
                setFigureIndex(id, current - 1)
              }}
              className="nodrag nopan shrink-0 rounded-full border border-slate-200 px-2 py-1 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-30"
              disabled={items.length < 2}
            >
              ‹
            </button>
            <div className="nowheel nodrag flex max-h-56 min-w-0 flex-1 items-center justify-center overflow-auto rounded-md bg-slate-50 p-1">
              <img
                src={fig.imageUrl}
                alt={fig.caption || `Figure ${fig.number}`}
                className="max-h-52 w-auto object-contain"
                draggable={false}
              />
            </div>
            <button
              type="button"
              aria-label="Next figure"
              onClick={(e) => {
                e.stopPropagation()
                setFigureIndex(id, current + 1)
              }}
              className="nodrag nopan shrink-0 rounded-full border border-slate-200 px-2 py-1 text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-30"
              disabled={items.length < 2}
            >
              ›
            </button>
          </div>
          {fig.caption && (
            <p className="nowheel nodrag mt-2 max-h-24 select-text overflow-y-auto text-[11px] leading-relaxed text-slate-500">
              <span className="font-semibold text-slate-700">Fig {fig.number}. </span>
              {fig.caption}
            </p>
          )}
        </>
      )}
      <Handle type="target" position={Position.Left} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
