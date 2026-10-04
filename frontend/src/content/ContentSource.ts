/** Plain content payload for a node: body text + verbatim salient terms. */
export interface NodeContent {
  text: string
  terms: string[]
}

/** The What payload also carries the paper title, link, and verbatim abstract. */
export interface WhatContent extends NodeContent {
  title?: string | null
  url?: string
  /** The paper's verbatim abstract, when available (papers only). */
  abstract?: string | null
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
  /** Reformulate a box's text at a complexity level (text-to-text). */
  rephrase(text: string, level: string, context?: string): Promise<NodeContent>
  /** Answer a custom question grounded in a box (and paper); signed-in only. */
  ask(question: string, boxText: string, arxiv?: string): Promise<NodeContent>
  /** Fetch (extracting on first call) a paper's figures. */
  fetchFigures(arxiv: string): Promise<FigureManifest>
}

/** A figure in the gallery manifest: caption + label + a backend image URL. */
export interface FigureManifestItem {
  number: string
  caption: string
  imageUrl: string
}

export interface FigureManifest {
  figures: FigureManifestItem[]
}
