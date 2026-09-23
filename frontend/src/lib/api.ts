export interface TopicRecord {
  arxiv_id: string
  title: string
  graph: StoredGraph
  updated_at?: string
}

export interface StoredGraph {
  nodes: unknown[]
  edges: unknown[]
  expansions: string[]
  specialsOpened: string[]
  pending: Record<string, unknown>
  hidden?: string[]
}

export interface FamiliarRecord {
  term: string
  definition: string
}

export interface Me {
  authenticated: boolean
  guest: boolean
  email: string | null
  name: string | null
}

/** Raised when the server rejects a guest for exceeding the paper limit. */
export class GuestLimitError extends Error {}

async function j<T>(url: string, opts?: RequestInit): Promise<T> {
  const r = await fetch(url, { credentials: 'same-origin', ...opts })
  if (r.status === 403) throw new GuestLimitError('guest-limit')
  if (!r.ok) throw new Error(`${opts?.method ?? 'GET'} ${url} failed (${r.status})`)
  return r.json() as Promise<T>
}

const JSON_HEADERS = { 'content-type': 'application/json' }

export const api = {
  me: () => j<Me>('/api/auth/me'),
  logout: () => j<{ ok: boolean }>('/api/auth/logout', { method: 'POST' }),

  listTopics: () => j<TopicRecord[]>('/api/topics'),
  putTopic: (arxiv_id: string, title: string, graph: StoredGraph) =>
    j<{ ok: boolean }>(`/api/topics/${encodeURIComponent(arxiv_id)}`, {
      method: 'PUT',
      headers: JSON_HEADERS,
      body: JSON.stringify({ title, graph }),
    }),

  listFamiliar: () => j<FamiliarRecord[]>('/api/familiar'),
  addFamiliar: (term: string, definition = '') =>
    j<{ ok: boolean }>('/api/familiar', { method: 'POST', headers: JSON_HEADERS, body: JSON.stringify({ term, definition }) }),
  removeFamiliar: (term: string) =>
    j<{ ok: boolean }>(`/api/familiar/${encodeURIComponent(term)}`, { method: 'DELETE' }),
}
