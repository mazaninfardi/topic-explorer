import type { Node, Edge } from '@xyflow/react'

/**
 * The kinds of node the graph can hold.
 * - `what`: the root headline node (one per exploration).
 * - `salient-term`: a plain-language definition node; may nest further terms.
 *   Salient-term nodes never expose Why/How.
 */
export type NodeKind = 'what' | 'salient-term'

/**
 * Content carried by every graph node. The index signature keeps this
 * assignable to React Flow's `Node<Record<string, unknown>>` constraint.
 */
export interface TGNodeData {
  kind: NodeKind
  /** The node's body text. */
  text: string
  /** Salient terms within `text` that can be expanded into child nodes. */
  terms: string[]
  [key: string]: unknown
}

export type TGNode = Node<TGNodeData>
export type TGEdge = Edge
