import { PaperInput } from '../components/PaperInput'
import { GraphCanvas } from '../components/GraphCanvas'

export function ExplorerPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaperInput />
      <main className="min-h-0 flex-1">
        <GraphCanvas />
      </main>
    </div>
  )
}
