import type { Node, Edge } from '@xyflow/react'

/**
 * Node kinds:
 * - `what`: the root headline node (one per paper); exposes Why/How actions.
 * - `why` / `how`: special explanation nodes opened from the What node.
 * - `abstract`: the paper's verbatim abstract (read-only; paper roots only).
 * - `salient-term`: a plain-language definition node; may nest further terms.
 * - `qa`: a signed-in user's custom question + its answer (a child of any box).
 */
export type NodeKind = 'what' | 'why' | 'how' | 'abstract' | 'salient-term' | 'qa'

/** Reading level for the per-box complexity control (default `standard`). */
export type ComplexityLevel = 'simpler' | 'standard' | 'technical'

export interface TGNodeData {
  kind: NodeKind
  /** The node's body text (empty while loading). */
  text: string
  /** Salient terms within `text` that can be expanded into child nodes. */
  terms: string[]
  /** True while the node's content is still being fetched. */
  loading?: boolean
  /** True while the box is being regenerated at a new complexity level. */
  rephrasing?: boolean
  /** For a salient-term node: the term it defines (used for "familiar"). */
  term?: string
  /** For a qa node: the question the user asked. */
  question?: string
  /** Chosen complexity level for a generated box (absent ⇒ standard). */
  complexity?: ComplexityLevel
  /** The original (standard-level) text/terms, kept so re-leveling never drifts. */
  baseText?: string
  baseTerms?: string[]
  /** For the root What node: the paper's title and link. */
  paperTitle?: string
  paperUrl?: string
  /** Root only: this is a free-text topic (a generic definition), not a paper — no Why/How, no PDF. */
  topic?: boolean
  /** Transient flag: node is fading out before removal. */
  removing?: boolean
  [key: string]: unknown
}

export type TGNode = Node<TGNodeData>
export type TGEdge = Edge
