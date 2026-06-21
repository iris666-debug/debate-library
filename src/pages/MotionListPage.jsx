import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useUserCollection } from '../hooks/useCollection'
import { MOTION_TYPES } from '../data/debateTaxonomy'

export default function MotionListPage() {
  const { items: motions, loading } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })
  const { items: modules } = useUserCollection('modules', {
    orderBy: 'createdAt',
    orderDir: 'asc',
  })

  const [search, setSearch] = useState('')
  const [activeTags, setActiveTags] = useState([])
  const [activeMotionType, setActiveMotionType] = useState('')

  const moduleMap = useMemo(() => {
    const m = {}
    modules.forEach((x) => {
      m[x.id] = x
    })
    return m
  }, [modules])

  const allTags = useMemo(() => {
    const set = new Set()
    motions.forEach((m) => (m.tags || []).forEach((t) => set.add(t)))
    return Array.from(set).sort()
  }, [motions])

  const filtered = useMemo(() => {
    const kw = search.trim().toLowerCase()
    return motions.filter((m) => {
      if (kw && !(m.text || '').toLowerCase().includes(kw)) return false
      if (activeMotionType && m.motionType !== activeMotionType) return false
      if (activeTags.length > 0) {
        const tags = m.tags || []
        if (!activeTags.some((t) => tags.includes(t))) return false
      }
      return true
    })
  }, [motions, search, activeTags, activeMotionType])

  const toggleTag = (t) => {
    setActiveTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  const hasFilters = search.trim() || activeTags.length > 0 || activeMotionType
  const isEmpty = !loading && motions.length === 0
  const isFirstTime = isEmpty && modules.length === 0
  const isFilteredEmpty = !loading && motions.length > 0 && filtered.length === 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">题卡库</h1>
          <p className="text-sm text-stone-500 mt-1">
            {loading
              ? '加载中…'
              : hasFilters
              ? `匹配 ${filtered.length} / ${motions.length} 张`
              : `共 ${motions.length} 张题卡`}
          </p>
        </div>
        <Link
          to="/motions/new"
          className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
        >
          + 新增题卡
        </Link>
      </div>

      {motions.length > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索 Motion 文本…"
              className="w-full rounded-lg border border-stone-300 pl-9 pr-3 py-2 text-sm focus:border-stone-900 focus:outline-none bg-white"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm select-none">
              🔎
            </span>
          </div>

          {MOTION_TYPES.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {MOTION_TYPES.map((t) => {
                const active = activeMotionType === t.value
                return (
                  <button
                    key={t.value}
                    type="button"
                    title={t.label}
                    onClick={() => setActiveMotionType(active ? '' : t.value)}
                    className={
                      'rounded-md px-2.5 py-1 text-xs transition ' +
                      (active
                        ? 'bg-stone-700 text-white'
                        : 'bg-stone-200 text-stone-700 hover:bg-stone-300')
                    }
                  >
                    {t.value}
                  </button>
                )
              })}
            </div>
          )}

          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center">
              {allTags.map((t) => {
                const active = activeTags.includes(t)
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={
                      'rounded-md px-2.5 py-1 text-xs transition ' +
                      (active
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-700 hover:bg-stone-200')
                    }
                  >
                    #{t}
                  </button>
                )
              })}
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setActiveTags([])
                    setActiveMotionType('')
                  }}
                  className="text-xs text-stone-500 hover:text-stone-900 ml-1"
                >
                  清除筛选
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {isFirstTime && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-5">
          <div className="space-y-2">
            <h2 className="text-xl font-semibold">👋 欢迎使用辩题库</h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              这是只属于你自己的 BP 辩题档案与训练工具。把题卡和万能模块攒起来,用复述训练和 POI 自答把它们内化成可调取的论点。
            </p>
            <p className="text-sm text-stone-500 leading-relaxed">
              数据自动同步到云端,电脑手机用同一账号都能继续看到同样的内容。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/motions/new"
              className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
            >
              + 录入第一张题卡
            </Link>
            <Link
              to="/modules"
              className="px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
            >
              + 添加万能模块
            </Link>
            <Link
              to="/data"
              className="px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
            >
              📂 从备份导入
            </Link>
          </div>
          <p className="text-xs text-stone-400 leading-relaxed pt-2 border-t border-stone-100">
            建议从模块开始建几条常用的(经济激励、权利保护…),录题卡时就能直接关联。
          </p>
        </div>
      )}

      {isEmpty && !isFirstTime && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center">
          <p className="text-stone-500 text-sm">还没有题卡。点上方"新增题卡"开始录入。</p>
        </div>
      )}

      {isFilteredEmpty && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center">
          <p className="text-stone-500 text-sm">没有匹配的题卡。</p>
          <button
            onClick={() => {
              setSearch('')
              setActiveTags([])
              setActiveMotionType('')
            }}
            className="text-xs text-stone-600 hover:text-stone-900 mt-2 underline"
          >
            清除筛选
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((m) => {
          const linkedModules = (m.linkedModuleIds || [])
            .map((mid) => moduleMap[mid])
            .filter(Boolean)
          return (
            <Link
              key={m.id}
              to={`/motions/${m.id}`}
              className="bg-white border border-stone-200 rounded-2xl p-4 space-y-2 hover:border-stone-400 hover:shadow-sm transition block"
            >
              <p className="font-medium leading-snug line-clamp-2">
                {m.text || '(无 Motion 文本)'}
              </p>
              {m.source && <p className="text-xs text-stone-500">{m.source}</p>}
              {((m.tags && m.tags.length > 0) || m.motionType || linkedModules.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {m.motionType && (
                    <span className="bg-stone-700 text-white rounded-md px-2 py-0.5 text-xs">
                      {m.motionType}
                    </span>
                  )}
                  {(m.tags || []).map((t) => (
                    <span
                      key={t}
                      className={
                        'rounded-md px-2 py-0.5 text-xs ' +
                        (activeTags.includes(t)
                          ? 'bg-stone-900 text-white'
                          : 'bg-stone-100 text-stone-700')
                      }
                    >
                      #{t}
                    </span>
                  ))}
                  {linkedModules.slice(0, 3).map((mod) => (
                    <span
                      key={mod.id}
                      className="bg-amber-50 text-amber-800 rounded-md px-2 py-0.5 text-xs"
                    >
                      {mod.name_zh || mod.name_en || '(未命名)'}
                    </span>
                  ))}
                  {linkedModules.length > 3 && (
                    <span className="text-xs text-stone-400 self-center">
                      +{linkedModules.length - 3}
                    </span>
                  )}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
