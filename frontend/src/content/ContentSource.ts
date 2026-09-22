import type { TGNodeData } from '../graph/types'

/** Raised by `deriveWhat` when the input can't yield a first and last sentence. */
export const TOO_SHORT_MESSAGE =
  'Please paste at least two sentences so we can find a beginning and an end.'

/**
 * The single seam between the UI and wherever node content comes from.
 * Pre-MVP ships `MockContentSource`; MVP will add a `BackendContentSource`
 * that hits the FastAPI/Gemini backend — the UI must only ever call these.
 */
export interface ContentSource {
  /** Build the root What node from a pasted paragraph. Throws on too-short input. */
  deriveWhat(paragraph: string): TGNodeData
  /** Select salient terms within a piece of text. */
  salientTerms(text: string): string[]
  /** Produce a definition node for an expanded term (itself carrying terms). */
  defineTerm(term: string): TGNodeData
}
