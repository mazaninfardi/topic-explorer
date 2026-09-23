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
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep the selection alive
      onClick={define}
      style={{ position: 'fixed', left: sel.x, top: sel.y - 8, transform: 'translate(-50%, -100%)', zIndex: 50 }}
      className="rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-white shadow-lg hover:bg-slate-700"
    >
      Define “{label}”
    </button>
  )
}
