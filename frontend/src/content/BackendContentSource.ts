import type { ContentSource, ExploreHandlers, NodeContent } from './ContentSource'

/** Talks to the FastAPI BFF: SSE for extraction, REST for term definitions. */
export class BackendContentSource implements ContentSource {
  explore(ref: string, handlers: ExploreHandlers): () => void {
    const es = new EventSource(`/api/extract?arxiv=${encodeURIComponent(ref)}`)
    let finished = false

    const close = () => {
      finished = true
      es.close()
    }

    es.addEventListener('what', (e) => handlers.onWhat(JSON.parse((e as MessageEvent).data)))
    es.addEventListener('why', (e) => handlers.onWhy(JSON.parse((e as MessageEvent).data)))
    es.addEventListener('how', (e) => {
      handlers.onHow(JSON.parse((e as MessageEvent).data))
      close() // stream complete — close so EventSource doesn't auto-reconnect
    })
    // Server-sent application error (has data) vs. a raw connection drop (none).
    es.addEventListener('error', (e) => {
      if (finished) return
      const data = (e as MessageEvent).data
      let message = 'Could not reach the server. Please try again.'
      if (data) {
        try {
          message = JSON.parse(data).message ?? message
        } catch {
          /* keep default */
        }
      }
      handlers.onError(message)
      close()
    })

    return close
  }

  async defineTerm(term: string): Promise<NodeContent> {
    const resp = await fetch('/api/define', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ term }),
    })
    if (!resp.ok) throw new Error('Failed to define term')
    return resp.json()
  }
}
