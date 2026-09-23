import type { Node, Edge } from '@xyflow/react'

/**
 * Node kinds:
 * - `what`: the root headline node (one per paper); exposes Why/How actions.
 * - `why` / `how`: special explanation nodes opened from the What node.
 * - `salient-term`: a plain-language definition node; may nest further terms.
 */
export type NodeKind = 'what' | 'why' | 'how' | 'salient-term'

export interface TGNodeData {
  kind: NodeKind
  /** The node's body text (empty while loading). */
  text: string
  /** Salient terms within `text` that can be expanded into child nodes. */
  terms: string[]
  /** True while the node's content is still being fetched. */
  loading?: boolean
  /** For a salient-term node: the term it defines (used for "familiar"). */
  term?: string
  /** For the root What node: the paper's title and link. */
  paperTitle?: string
  paperUrl?: string
  /** Transient flag: node is fading out before removal. */
  removing?: boolean
  [key: string]: unknown
}

export type TGNode = Node<TGNodeData>
export type TGEdge = Edge
