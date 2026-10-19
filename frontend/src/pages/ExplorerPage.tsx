import { PaperInput } from '../components/PaperInput'
import { GraphCanvas } from '../components/GraphCanvas'
import { Onboarding } from '../components/Onboarding'
import { PaperPanel } from '../components/PaperPanel'
import { SelectionDefiner } from '../components/SelectionDefiner'
import { SignInPrompt } from '../components/SignInPrompt'

export function ExplorerPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PaperInput />
      <div className="flex min-h-0 flex-1">
        <main className="relative min-h-0 flex-1">
          <GraphCanvas />
          <Onboarding />
        </main>
        <PaperPanel />
      </div>
      <SelectionDefiner />
      <SignInPrompt />
    </div>
  )
}
