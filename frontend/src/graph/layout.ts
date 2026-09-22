import type { XYPosition } from '@xyflow/react'

/** Where the root What node is placed. */
export const ROOT_POSITION: XYPosition = { x: 0, y: 0 }

const HORIZONTAL_GAP = 320
const VERTICAL_GAP = 180

/**
 * Simple deterministic placement: children fan out to the right of their
 * parent and stack vertically by birth order. No auto-layout library — this
 * is a Pre-MVP skeleton (auto-layout is a later concern).
 */
export function childPosition(parent: XYPosition, childIndex: number): XYPosition {
  return {
    x: parent.x + HORIZONTAL_GAP,
    y: parent.y + childIndex * VERTICAL_GAP,
  }
}
