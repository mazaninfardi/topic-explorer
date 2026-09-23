import { PaperInput } from '../components/PaperInput'
import { GraphCanvas } from '../components/GraphCanvas'
import { SelectionDefiner } from '../components/SelectionDefiner'

export function ExplorerPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaperInput />
      <main className="min-h-0 flex-1">
        <GraphCanvas />
      </main>
      <SelectionDefiner />
    </div>
  )
}
