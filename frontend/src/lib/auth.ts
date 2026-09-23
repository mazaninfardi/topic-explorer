import { create } from 'zustand'
import { api, type Me } from './api'

const GUEST: Me = { authenticated: false, guest: true, email: null, name: null }

interface AuthState {
  me: Me | null
  load: () => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  me: null,
  load: async () => {
    try {
      set({ me: await api.me() })
    } catch {
      set({ me: GUEST })
    }
  },
  signOut: async () => {
    try {
      await api.logout()
    } catch {
      /* ignore */
    }
    set({ me: null })
    await get().load()
  },
}))
