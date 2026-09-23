import { NavLink, Route, Routes } from 'react-router-dom'
import { ExplorerPage } from './pages/ExplorerPage'
import { TopicsPage } from './pages/TopicsPage'
import { FamiliarTermsPage } from './pages/FamiliarTermsPage'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded px-2 py-1 ${isActive ? 'bg-white/15 text-white' : 'text-slate-300 hover:text-white'}`

export default function App() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 bg-slate-900 px-4 py-3 text-white">
        <div>
          <h1 className="text-lg font-semibold">Topic Explorer</h1>
          <p className="text-xs text-slate-300">
            Paste an arXiv link → explore What, Why, and How; click salient terms to go deeper
          </p>
        </div>
        <nav className="flex gap-1 text-sm">
          <NavLink to="/" end className={navClass}>Explore</NavLink>
          <NavLink to="/topics" className={navClass}>Topics</NavLink>
          <NavLink to="/terms/familiar" className={navClass}>Familiar</NavLink>
        </nav>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">
        <Routes>
          <Route path="/" element={<ExplorerPage />} />
          <Route path="/topics" element={<TopicsPage />} />
          <Route path="/terms/familiar" element={<FamiliarTermsPage />} />
        </Routes>
      </div>
    </div>
  )
}
