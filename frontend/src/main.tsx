import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { initPersistence, restoreLast } from './lib/persistence'
import { useAuthStore } from './lib/auth'

// Establish the session (guest or account) first — this also sets the session
// cookie — then restore the user's data and start autosaving.
void useAuthStore
  .getState()
  .load()
  .then(() => restoreLast())
initPersistence()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
