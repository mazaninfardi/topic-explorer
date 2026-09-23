import { useAuthStore } from '../lib/auth'

/** Slim persistent bar for guests: what remains + an invitation to save by signing in. */
export function GuestBar() {
  const me = useAuthStore((s) => s.me)
  if (!me || !me.guest) return null
  const left = me.papers_left

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-100 bg-sky-50 px-4 py-1.5 text-xs text-sky-800">
      <span>
        You’re exploring as a guest.
        {typeof left === 'number' ? ` ${left} of ${me.guest_limit} free papers left.` : ''} Sign in to save your
        explorations.
      </span>
      <a href="/api/auth/login" className="font-medium underline hover:text-sky-900">
        Log in
      </a>
    </div>
  )
}
