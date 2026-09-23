import { useEffect, useRef } from 'react'
import { useAuthStore } from '../lib/auth'
import { useGraphStore } from '../graph/store'
import { restoreLast } from '../lib/persistence'

interface GsiId {
  initialize: (opts: { client_id: string; callback: (r: { credential: string }) => void }) => void
  renderButton: (el: HTMLElement, opts: Record<string, string>) => void
}
const gsi = () => (window as unknown as { google?: { accounts?: { id?: GsiId } } }).google?.accounts?.id

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined) ?? ''

// After auth changes, load the (now different) user's data.
async function refreshUserData() {
  useGraphStore.getState().reset()
  await restoreLast()
}

export function AuthButton() {
  const me = useAuthStore((s) => s.me)
  const signIn = useAuthStore((s) => s.signIn)
  const signOut = useAuthStore((s) => s.signOut)
  const btnRef = useRef<HTMLDivElement>(null)

  const signedIn = me && !me.guest

  useEffect(() => {
    if (signedIn || !CLIENT_ID) return
    const render = () => {
      const id = gsi()
      if (!id || !btnRef.current) return
      id.initialize({
        client_id: CLIENT_ID,
        callback: async (r) => {
          await signIn(r.credential)
          await refreshUserData()
        },
      })
      id.renderButton(btnRef.current, { theme: 'filled_blue', size: 'medium', type: 'standard' })
    }
    if (gsi()) return render()
    const existing = document.getElementById('gsi-script') as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', render)
      return
    }
    const sc = document.createElement('script')
    sc.id = 'gsi-script'
    sc.src = 'https://accounts.google.com/gsi/client'
    sc.async = true
    sc.onload = render
    document.head.appendChild(sc)
  }, [signedIn, signIn])

  if (signedIn) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-300">{me?.name || me?.email}</span>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            await refreshUserData()
          }}
          className="rounded px-2 py-1 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    )
  }
  if (!CLIENT_ID) return <span className="text-xs text-slate-500">sign-in not configured</span>
  return <div ref={btnRef} />
}
