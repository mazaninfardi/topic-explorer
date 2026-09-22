import type { TGNodeData } from '../graph/types'
import { type ContentSource, TOO_SHORT_MESSAGE } from './ContentSource'
import { selectSalientTerms, splitSentences } from './text'

/**
 * Mock content: derives a "What" from the first and last sentences, picks
 * salient terms heuristically, and fabricates placeholder definitions that
 * themselves contain salient terms so nested exploration works. Entirely
 * throwaway-free — it implements the same `ContentSource` seam the real
 * backend will implement at MVP.
 */
export class MockContentSource implements ContentSource {
  deriveWhat(paragraph: string): TGNodeData {
    const sentences = splitSentences(paragraph)
    if (sentences.length < 2) {
      throw new Error(TOO_SHORT_MESSAGE)
    }
    const first = sentences[0]
    const last = sentences[sentences.length - 1]
    const text = first === last ? first : `${first} ${last}`
    return { kind: 'what', text, terms: selectSalientTerms(text) }
  }

  salientTerms(text: string): string[] {
    return selectSalientTerms(text)
  }

  defineTerm(term: string): TGNodeData {
    const text =
      `${term} — a placeholder explanation. This mock definition describes ` +
      `"${term}" using illustrative ideas like mechanism, structure, and ` +
      `interaction, so nested exploration keeps working. The real model will ` +
      `replace this definition at MVP.`
    return { kind: 'salient-term', text, terms: selectSalientTerms(text) }
  }
}
