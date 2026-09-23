import { useEffect, useState } from 'react'
import { useGraphStore } from '../graph/store'
import { useAuthStore } from '../lib/auth'
import { EXAMPLE_TOPIC } from '../content/exampleGraph'

const KEY = 'tg_ftux_done'

const readDone = () => {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/**
 * First-run experience: for a guest with an empty canvas, load a pre-built
 * example graph (zero wait) and show a short, dismissible walkthrough. While it
 * is up, `body.ftux-hint` gently pulses the highlighted words to draw the eye.
 */
export function Onboarding() {
  const me = useAuthStore((s) => s.me)
  const isExample = useGraphStore((s) => s.isExample)
  const loadExample = useGraphStore((s) => s.loadExample)
  const [dismissed, setDismissed] = useState(readDone)

  // Load the example only for a fresh guest canvas (signed-in users restore their own data).
  useEffect(() => {
    if (dismissed || !me?.guest) return
    const st = useGraphStore.getState()
    if (st.nodes.length === 0 && st.status === 'idle') loadExample(EXAMPLE_TOPIC)
  }, [me, dismissed, loadExample])

  useEffect(() => {
    const show = !dismissed && isExample
    try {
      document.body.classList.toggle('ftux-hint', show)
    } catch {
      /* ignore */
    }
    return () => {
      try {
        document.body.classList.remove('ftux-hint')
      } catch {
        /* ignore */
      }
    }
  }, [dismissed, isExample])

  if (dismissed || !isExample) return null

  const done = () => {
    try {
      localStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    setDismissed(true)
  }

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-4 z-20 flex justify-center px-4">
      <div className="pointer-events-auto max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-lg">
        <div className="mb-1.5 flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">👋 Welcome — here’s how it works</h3>
          <button
            type="button"
            onClick={done}
            className="rounded bg-sky-600 px-2 py-1 text-xs font-medium text-white hover:bg-sky-700"
          >
            Got it
          </button>
        </div>
        <ol className="ml-4 list-decimal space-y-1 text-[13px] text-slate-600">
          <li>
            This is a live example. The <b>What</b> box is the plain-English summary.
          </li>
          <li>
            Click any{' '}
            <span className="rounded bg-slate-100 px-1 underline decoration-dotted decoration-sky-500">
              highlighted word
            </span>{' '}
            to open a simple definition.
          </li>
          <li>
            Open <span className="font-medium text-amber-700">Why</span> or{' '}
            <span className="font-medium text-violet-700">How</span> for the motivation and the method.
          </li>
        </ol>
        <p className="mt-2 text-xs text-slate-400">Paste a topic or arXiv link above to explore your own.</p>
      </div>
    </div>
  )
}
