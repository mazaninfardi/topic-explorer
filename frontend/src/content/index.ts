import type { ContentSource } from './ContentSource'
import { MockContentSource } from './MockContentSource'

/**
 * The app-wide content source. Everything that needs node content imports
 * this — swapping the implementation here (e.g. for a BackendContentSource
 * at MVP) is the only change needed.
 */
export const contentSource: ContentSource = new MockContentSource()

export type { ContentSource }
export { TOO_SHORT_MESSAGE } from './ContentSource'
