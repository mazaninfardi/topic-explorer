import { useGraphStore } from '../graph/store'

/** arXiv blocks framing its abstract page, but the PDF embeds fine. */
const toPdf = (absUrl: string) => absUrl.replace('/abs/', '/pdf/')

/** Collapsible side-by-side viewer for the current paper's PDF. */
export function PaperPanel() {
  const url = useGraphStore((s) => s.paperPanelUrl)
  const setPaperPanel = useGraphStore((s) => s.setPaperPanel)
  if (!url) return null

  return (
    <aside className="flex h-full w-full flex-col border-l border-slate-200 bg-white sm:w-[45%] sm:min-w-[360px] sm:max-w-[680px]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <span className="text-xs font-medium text-slate-600">Full paper</span>
        <div className="flex items-center gap-1">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded px-2 py-1 text-xs text-sky-600 hover:bg-sky-50 hover:text-sky-800"
          >
            open in arXiv ↗
          </a>
          <button
            type="button"
            onClick={() => setPaperPanel(null)}
            title="Collapse panel"
            aria-label="Collapse panel"
            className="rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l8 8M14 6l-8 8" />
            </svg>
          </button>
        </div>
      </div>
      <iframe src={toPdf(url)} title="Full paper" className="h-full w-full flex-1" />
    </aside>
  )
}
