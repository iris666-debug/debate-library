import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserCollection } from '../hooks/useCollection'

function countPois(motion) {
  let n = 0
  ;[...(motion.propArgs || []), ...(motion.oppArgs || [])].forEach((a) => {
    n += (a.pois || []).length
  })
  return n
}

export default function PoiPickerPage() {
  const { items: motions, loading } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })
  const [search, setSearch] = useState('')

  const enriched = useMemo(
    () => motions.map((m) => ({ ...m, _poiCount: countPois(m) })),
    [motions]
  )

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    if (!kw) return enriched
    return enriched.filter((m) => (m.text || '').toLowerCase().includes(kw))
  }, [enriched, search])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">POI 自答训练</h1>
        <p className="text-sm text-stone-500 mt-1">
          {loading ? '加载中…' : `${motions.length} 张题卡`}
        </p>
      </div>

      {!loading && motions.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center space-y-2">
          <p className="text-stone-500 text-sm">还没有题卡。先去题卡库录入。</p>
        </div>
      )}

      {motions.length > 0 && (
        <>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索 Motion 文本…"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none bg-white"
          />

          <ul className="space-y-2">
            {filtered.map((m) => {
              const disabled = m._poiCount === 0
              return (
                <li key={m.id}>
                  <Link
                    to={disabled ? `/motions/${m.id}/edit` : `/poi/${m.id}`}
                    className={
                      'block bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 hover:shadow-sm transition ' +
                      (disabled ? 'opacity-60' : '')
                    }
                  >
                    <p className="font-medium leading-snug">
                      {m.text || '(无 Motion 文本)'}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      {m.source ? (
                        <p className="text-xs text-stone-500">{m.source}</p>
                      ) : (
                        <span />
                      )}
                      <span
                        className={
                          'text-xs ' +
                          (disabled ? 'text-stone-400' : 'text-stone-600')
                        }
                      >
                        {disabled ? '无 POI · 去录入' : `${m._poiCount} 题 POI`}
                      </span>
                    </div>
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
