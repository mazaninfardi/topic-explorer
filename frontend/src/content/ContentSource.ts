/** Plain content payload for a node: body text + verbatim salient terms. */
export interface NodeContent {
  text: string
  terms: string[]
}

/** The What payload also carries the paper title and a link to the paper. */
export interface WhatContent extends NodeContent {
  title?: string | null
  url?: string
}

/** Streaming callbacks for an exploration (What arrives first, then Why/How). */
export interface ExploreHandlers {
  onWhat: (content: WhatContent) => void
  onWhy: (content: NodeContent) => void
  onHow: (content: NodeContent) => void
  onError: (message: string) => void
}

/**
 * The single seam between the UI and wherever node content comes from.
 * MVP ships `BackendContentSource` (arXiv → Gemini via the FastAPI BFF).
 */
export interface ContentSource {
  /** Start extracting a paper; returns an unsubscribe to cancel the stream. */
  explore(ref: string, handlers: ExploreHandlers): () => void
  /** Define a salient term (general, plain-language). */
  defineTerm(term: string): Promise<NodeContent>
}
