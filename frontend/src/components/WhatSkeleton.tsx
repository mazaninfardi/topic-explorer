import { useEffect, useState } from 'react'

const LINES = [
  'Diving into the deep end…',
  'Reading the paper so you don’t have to…',
  'Translating academese into plain English…',
  'Untangling the jargon…',
  'Surfacing the big idea…',
  'Almost there — polishing the summary…',
]

/** Skeleton + rotating, honest-but-playful status while the What is extracted. */
export function WhatSkeleton() {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => Math.min(n + 1, LINES.length - 1)), 2600)
    return () => clearInterval(id)
  }, [])

  return (
    <div>
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-sky-700">
        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-sky-300 border-t-sky-600" />
        <span>{LINES[i]}</span>
      </div>
      <div className="space-y-2">
        <div className="tg-skeleton h-3 w-5/6 rounded" />
        <div className="tg-skeleton h-3 w-full rounded" />
        <div className="tg-skeleton h-3 w-4/6 rounded" />
        <div className="tg-skeleton h-3 w-11/12 rounded" />
      </div>
      <p className="mt-3 text-xs text-slate-400">First read of a new paper can take a little while.</p>
    </div>
  )
}
