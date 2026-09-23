import { PaperInput } from '../components/PaperInput'
import { GuestBar } from '../components/GuestBar'
import { GraphCanvas } from '../components/GraphCanvas'
import { Onboarding } from '../components/Onboarding'
import { SelectionDefiner } from '../components/SelectionDefiner'

export function ExplorerPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaperInput />
      <GuestBar />
      <main className="relative min-h-0 flex-1">
        <GraphCanvas />
        <Onboarding />
      </main>
      <SelectionDefiner />
    </div>
  )
}
