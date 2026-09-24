import { useEffect, useState } from 'react'
import { useGraphStore } from '../graph/store'

interface Selection {
  nodeId: string
  text: string
  x: number
  y: number
}

/**
 * Lets the user define an arbitrary phrase: select text inside any box and a
 * floating "Define" button appears; clicking it expands that phrase as a term.
 */
export function SelectionDefiner() {
  const [sel, setSel] = useState<Selection | null>(null)
  const expandTerm = useGraphStore((s) => s.expandTerm)

  useEffect(() => {
    const onMouseUp = () => {
      const s = window.getSelection()
      if (!s || s.isCollapsed) {
        setSel(null)
        return
      }
      const text = s.toString().trim()
      if (text.length < 2 || text.length > 80) {
        setSel(null)
        return
      }
      const anchor = s.anchorNode
      const el = anchor && (anchor.nodeType === 1 ? (anchor as Element) : anchor.parentElement)
      const host = el?.closest('[data-node-id]') as HTMLElement | null
      if (!host) {
        setSel(null)
        return
      }
      const rect = s.getRangeAt(0).getBoundingClientRect()
      setSel({ nodeId: host.dataset.nodeId!, text, x: rect.left + rect.width / 2, y: rect.top })
    }
    document.addEventListener('mouseup', onMouseUp)
    return () => document.removeEventListener('mouseup', onMouseUp)
  }, [])

  if (!sel) return null

  const define = () => {
    expandTerm(sel.nodeId, sel.text)
    window.getSelection()?.removeAllRanges()
    setSel(null)
  }

  const label = sel.text.length > 24 ? `${sel.text.slice(0, 24)}…` : sel.text

  return (
    <div
      className="tg-pop"
      style={{ position: 'fixed', left: sel.x, top: sel.y - 10, transform: 'translate(-50%, -100%)', zIndex: 50 }}
    >
      <button
        type="button"
        onMouseDown={(e) => e.preventDefault()} // keep the selection alive
        onClick={define}
        className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-3 py-1.5 text-sm font-semibold text-white shadow-lg ring-2 ring-white hover:bg-sky-700"
      >
        <svg width="15" height="15" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 5v10M5 10h10" strokeLinecap="round" />
        </svg>
        Define “{label}”
      </button>
      {/* Caret pointing at the selection */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          top: '100%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid #0284c7',
        }}
      />
    </div>
  )
}
