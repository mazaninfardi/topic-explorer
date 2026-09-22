import { useState } from 'react'
import { useGraphStore } from '../graph/store'
import { contentSource } from '../content'

const SAMPLE =
  'Large language models have rapidly become general-purpose tools for reasoning and generation. ' +
  'Researchers introduced a transformer architecture that relies entirely on attention mechanisms. ' +
  'This approach removes recurrence and enables far greater parallelization during training. ' +
  'As a result, these models achieve strong performance across many language understanding benchmarks.'

export function ParagraphInput() {
  const [text, setText] = useState(SAMPLE)
  const setRoot = useGraphStore((s) => s.setRoot)
  const setError = useGraphStore((s) => s.setError)
  const error = useGraphStore((s) => s.error)

  const explore = () => {
    try {
      setRoot(contentSource.deriveWhat(text))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not process that input.')
    }
  }

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 bg-white p-4">
      <label htmlFor="paragraph" className="text-sm font-medium text-slate-700">
        Paste a paragraph to explore
      </label>
      <textarea
        id="paragraph"
        className="h-24 w-full resize-y rounded-md border border-slate-300 p-2 text-sm text-slate-800 focus:border-sky-500 focus:outline-none"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={explore}
          className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
        >
          Explore
        </button>
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </div>
  )
}
