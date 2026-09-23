import { useEffect, useState } from 'react'
import { useGraphStore } from './store'

/** True for ~1.3s after this node becomes the most recently added/revealed one. */
export function useJustAdded(id: string): boolean {
  const isLast = useGraphStore((s) => s.lastAddedId === id)
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (!isLast) return
    const raf = requestAnimationFrame(() => setOn(true))
    const t = setTimeout(() => setOn(false), 1300)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
      setOn(false)
    }
  }, [isLast])
  return on
}
