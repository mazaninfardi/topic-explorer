import { ParagraphInput } from './components/ParagraphInput'
import { GraphCanvas } from './components/GraphCanvas'

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="bg-slate-900 px-4 py-3 text-white">
        <h1 className="text-lg font-semibold">Topic Explorer</h1>
        <p className="text-xs text-slate-300">
          Pre-MVP skeleton — mocked content, click salient terms to explore
        </p>
      </header>
      <ParagraphInput />
      <main className="min-h-0 flex-1">
        <GraphCanvas />
      </main>
    </div>
  )
}
