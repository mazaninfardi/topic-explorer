/** Extract a canonical arXiv id (with version) from a URL or bare id, or null. */
export function arxivIdOf(ref: string): string | null {
  const m = ref.trim().match(/(\d{4}\.\d{4,5})(v\d+)?/)
  return m ? m[1] + (m[2] ?? '') : null
}
