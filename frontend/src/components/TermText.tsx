function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

interface TermTextProps {
  text: string
  terms: string[]
  onTermClick: (term: string) => void
}

/**
 * Renders `text`, wrapping any occurrence of a salient term in a clickable
 * button. The canonical term (as stored) is passed to `onTermClick`, even if
 * the matched text differs in casing.
 */
export function TermText({ text, terms, onTermClick }: TermTextProps) {
  if (terms.length === 0) {
    return <span>{text}</span>
  }

  const canonical = new Map(terms.map((t) => [t.toLowerCase(), t]))
  const pattern = new RegExp(`\\b(${terms.map(escapeRegExp).join('|')})\\b`, 'gi')
  const parts = text.split(pattern)

  return (
    <span>
      {parts.map((part, i) => {
        const term = canonical.get(part.toLowerCase())
        if (!term) return <span key={i}>{part}</span>
        return (
          <button
            key={i}
            type="button"
            className="nodrag nopan mx-0.5 rounded bg-sky-100 px-1 font-medium text-sky-800 underline decoration-dotted underline-offset-2 hover:bg-sky-200"
            onClick={(e) => {
              e.stopPropagation()
              onTermClick(term)
            }}
          >
            {part}
          </button>
        )
      })}
    </span>
  )
}
