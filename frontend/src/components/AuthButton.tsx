import { useAuthStore } from '../lib/auth'
import { useGraphStore } from '../graph/store'
import { restoreLast } from '../lib/persistence'

export function AuthButton() {
  const me = useAuthStore((s) => s.me)
  const signOut = useAuthStore((s) => s.signOut)

  if (me && !me.guest) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-700">{me.name || me.email}</span>
        <button
          type="button"
          onClick={async () => {
            await signOut()
            useGraphStore.getState().reset()
            await restoreLast()
          }}
          className="rounded-md px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
        >
          Sign out
        </button>
      </div>
    )
  }

  // Guest: a clear primary button that redirects to Google and returns signed in.
  return (
    <a
      href="/api/auth/login"
      className="rounded-md bg-sky-600 px-3 py-1 text-sm font-medium text-white hover:bg-sky-700"
    >
      Log in
    </a>
  )
}
