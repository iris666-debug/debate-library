import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useUserCollection } from '../hooks/useCollection'

export default function DrillPickerPage() {
  const { items: motions, loading } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return motions
    return motions.filter((m) => (m.text || '').toLowerCase().includes(kw))
  }, [motions, search])

  const startRandom = () => {
    const pool = filtered.length > 0 ? filtered : motions
    if (pool.length === 0) return
    const pick = pool[Math.floor(Math.random() * pool.length)]
    navigate(`/drill/${pick.id}`)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">复述训练</h1>
        <p className="text-sm text-stone-500 mt-1">
          {loading ? '加载中…' : `从 ${motions.length} 张题卡里选一张开始`}
        </p>
      </div>

      {!loading && motions.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center space-y-2">
          <p className="text-stone-500 text-sm">还没有题卡。先去题卡库录入几张。</p>
          <Link
            to="/"
            className="inline-block text-xs text-stone-600 hover:text-stone-900 underline"
          >
            前往题卡库
          </Link>
        </div>
      )}

      {motions.length > 0 && (
        <>
          <div className="flex gap-2">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索 Motion 文本…"
              className="flex-1 rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none bg-white"
            />
            <button
              onClick={startRandom}
              className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 whitespace-nowrap"
            >
              🎲 随机抽题
            </button>
          </div>

          <ul className="space-y-2">
            {filtered.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/drill/${m.id}`}
                  className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 hover:shadow-sm transition"
                >
                  <p className="font-medium leading-snug">
                    {m.text || '(无 Motion 文本)'}
                  </p>
                  {m.source && (
                    <p className="text-xs text-stone-500 mt-0.5">{m.source}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {filtered.length === 0 && search && (
            <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center">
              <p className="text-stone-500 text-sm">没有匹配的题卡。</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
