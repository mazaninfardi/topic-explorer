import type { ContentSource } from './ContentSource'
import { BackendContentSource } from './BackendContentSource'

/**
 * The app-wide content source. Swap the implementation here to change where
 * node content comes from (this is the seam established at Pre-MVP).
 */
export const contentSource: ContentSource = new BackendContentSource()

export type { ContentSource, NodeContent, WhatContent, ExploreHandlers } from './ContentSource'
