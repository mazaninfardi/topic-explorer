import { NavLink, Route, Routes } from 'react-router-dom'
import { ExplorerPage } from './pages/ExplorerPage'
import { TopicsPage } from './pages/TopicsPage'
import { FamiliarTermsPage } from './pages/FamiliarTermsPage'
import { AuthButton } from './components/AuthButton'
import { useAuthStore } from './lib/auth'

const navClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-2.5 py-1 transition-colors ${
    isActive ? 'bg-sky-50 font-medium text-sky-700' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
  }`

export default function App() {
  const signedIn = useAuthStore((s) => s.me && !s.me.guest)
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-6 w-6 rounded-md bg-gradient-to-br from-sky-500 to-violet-500" />
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Topic Explorer</h1>
            <p className="text-xs text-slate-500">
              Explore a topic or paper → What, Why, and How; click any highlighted word to go deeper
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-1 text-sm">
            <NavLink to="/" end className={navClass}>Explore</NavLink>
            {signedIn && (
              <>
                <NavLink to="/topics" className={navClass}>Topics</NavLink>
                <NavLink to="/terms/familiar" className={navClass}>Known</NavLink>
              </>
            )}
          </nav>
          <AuthButton />
        </div>
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
