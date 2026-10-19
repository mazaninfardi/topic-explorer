import { useGraphStore } from '../graph/store'

/** Shown when a guest tries a signed-in-only action (explore, define a new term). */
export function SignInPrompt() {
  const open = useGraphStore((s) => s.signInPrompt)
  const dismiss = useGraphStore((s) => s.dismissSignIn)
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={dismiss}
      role="presentation"
    >
      <div
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-semibold text-slate-900">Sign in to keep exploring</h2>
        <p className="mt-1.5 text-sm text-slate-600">
          Exploring papers and topics — and defining new terms — is free once you sign in. The example stays
          here so you can look around first.
        </p>
        <div className="mt-4 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={dismiss}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
          >
            Not now
          </button>
          <a
            href="/api/auth/login"
            className="rounded-md bg-sky-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-sky-700"
          >
            Sign in with Google
          </a>
        </div>
      </div>
    </div>
  )
}
