import { useState } from 'react'
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
  const [menuOpen, setMenuOpen] = useState(false)
  const close = () => setMenuOpen(false)

  const links = (
    <>
      <NavLink to="/" end className={navClass} onClick={close}>
        Explore
      </NavLink>
      {signedIn && (
        <>
          <NavLink to="/topics" className={navClass} onClick={close}>
            Topics
          </NavLink>
          <NavLink to="/terms/familiar" className={navClass} onClick={close}>
            Known
          </NavLink>
        </>
      )}
    </>
  )

  return (
    <div className="flex h-full flex-col">
      <header className="relative flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <img src="/favicon.svg" alt="" aria-hidden className="h-6 w-6" />
          <h1 className="text-lg font-semibold text-slate-900">Topic Explorer</h1>
        </div>

        {/* Wide screens: inline nav + auth */}
        <div className="hidden items-center gap-4 sm:flex">
          <nav className="flex gap-1 text-sm">{links}</nav>
          <AuthButton />
        </div>

        {/* Narrow screens: hamburger toggle */}
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={menuOpen}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
            {menuOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-20 sm:hidden" onClick={close} aria-hidden />
            <div className="absolute right-2 top-full z-30 mt-1 flex w-48 flex-col gap-1 rounded-lg border border-slate-200 bg-white p-2 text-sm shadow-lg sm:hidden">
              <nav className="flex flex-col gap-1">{links}</nav>
              <div className="mt-1 border-t border-slate-100 pt-2">
                <AuthButton />
              </div>
            </div>
          </>
        )}
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
