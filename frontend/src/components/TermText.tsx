import { useGraphStore } from '../graph/store'

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface TermTextProps {
  text: string
  terms: string[]
  onTermClick: (term: string) => void
}

/**
 * Renders `text`, wrapping any salient term in a clickable chip. Terms the user
 * has marked "familiar" get a small tick and a distinct style, but stay
 * clickable so they can be reviewed.
 */
export function TermText({ text, terms, onTermClick }: TermTextProps) {
  const familiar = useGraphStore((s) => s.familiar)

  if (terms.length === 0) return <span>{text}</span>

  const familiarLc = new Set([...familiar].map((t) => t.toLowerCase()))
  const canonical = new Map(terms.map((t) => [t.toLowerCase(), t]))
  const pattern = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi')
  const parts = text.split(pattern)

  return (
    <span>
      {parts.map((part, i) => {
        const term = canonical.get(part.toLowerCase())
        if (!term) return <span key={i}>{part}</span>
        const isFamiliar = familiarLc.has(part.toLowerCase())
        return (
          <button
            key={i}
            type="button"
            className={`tg-term nodrag nopan mx-0.5 rounded px-1 font-medium underline decoration-dotted underline-offset-2 ${
              isFamiliar
                ? 'bg-emerald-50 text-emerald-800 decoration-emerald-400 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-800 decoration-sky-500 hover:bg-slate-200'
            }`}
            onClick={(e) => {
              e.stopPropagation()
              onTermClick(term)
            }}
          >
            {part}
            {isFamiliar && <span className="ml-0.5 text-emerald-600">✓</span>}
          </button>
        )
      })}
    </span>
  )
}
