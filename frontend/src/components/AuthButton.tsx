import { useAuthStore } from '../lib/auth'
import { useGraphStore } from '../graph/store'
import { restoreLast } from '../lib/persistence'

export function AuthButton() {
  const me = useAuthStore((s) => s.me)
  const signOut = useAuthStore((s) => s.signOut)

  if (me && !me.guest) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-200">{me.name || me.email}</span>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            useGraphStore.getState().reset()
            await restoreLast()
          }}
          className="rounded px-2 py-1 text-slate-300 hover:bg-white/10 hover:text-white"
        >
          Sign out
        </button>
      </div>
    )
  }

  // Guest: a plain link that redirects to Google and returns signed in.
  return (
    <a
      href="/api/auth/login"
      className="rounded px-3 py-1 text-sm font-medium text-slate-200 hover:bg-white/10 hover:text-white"
    >
      Log in
    </a>
  )
}
