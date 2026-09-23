import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, type TopicRecord } from '../lib/api'
import { useGraphStore } from '../graph/store'

export function TopicsPage() {
  const [topics, setTopics] = useState<TopicRecord[] | null>(null)
  const loadTopic = useGraphStore((s) => s.loadTopic)
  const navigate = useNavigate()

  useEffect(() => {
    api.listTopics().then(setTopics).catch(() => setTopics([]))
  }, [])

  const open = (rec: TopicRecord) => {
    loadTopic(rec)
    navigate('/')
  }

  return (
    <div className="mx-auto w-full max-w-2xl p-6">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Your topics</h2>
      {topics === null ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : topics.length === 0 ? (
        <p className="text-sm text-slate-500">No topics yet — explore a paper to get started.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
          {topics.map((t) => (
            <li key={t.arxiv_id}>
              <button
                type="button"
                onClick={() => open(t)}
                className="flex w-full items-center justify-between gap-4 p-3 text-left hover:bg-slate-50"
              >
                <span className="truncate text-sm text-slate-800">{t.title || t.arxiv_id}</span>
                {t.updated_at && (
                  <span className="shrink-0 text-xs text-slate-400">
                    {new Date(t.updated_at).toLocaleDateString()}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
