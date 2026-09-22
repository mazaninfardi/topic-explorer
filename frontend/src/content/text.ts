/** Naive, mock-grade text utilities for the Pre-MVP skeleton. */

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'any', 'can', 'her',
  'was', 'one', 'our', 'out', 'has', 'his', 'how', 'its', 'may', 'new', 'now',
  'this', 'that', 'with', 'from', 'they', 'their', 'them', 'then', 'than',
  'have', 'here', 'what', 'when', 'where', 'which', 'while', 'will', 'would',
  'into', 'such', 'also', 'each', 'some', 'these', 'those', 'about', 'because',
])

/** Split text into trimmed, non-empty sentences on . ! ? boundaries. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

/**
 * Deterministically pick up to `max` salient terms from `text`: the longest
 * non-stopword words, de-duplicated case-insensitively, ties broken by first
 * appearance. Returns the terms in their original casing.
 */
export function selectSalientTerms(text: string, max = 4): string[] {
  const matches = text.match(/[A-Za-z][A-Za-z-]{2,}/g) ?? []
  const seen = new Map<string, { word: string; order: number }>()
  matches.forEach((word, order) => {
    const lower = word.toLowerCase()
    if (lower.length < 4 || STOPWORDS.has(lower) || seen.has(lower)) return
    seen.set(lower, { word, order })
  })
  return [...seen.values()]
    .sort((a, b) => b.word.length - a.word.length || a.order - b.order)
    .slice(0, max)
    .map((entry) => entry.word)
}
