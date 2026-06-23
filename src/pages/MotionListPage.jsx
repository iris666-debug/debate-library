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
  const [sortBy, setSortBy] = useState('newest')

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
    let result = motions.filter((m) => {
      if (search.trim()) {
        const s = search.toLowerCase()
        const text = (m.text || '').toLowerCase()
        const source = (m.source || '').toLowerCase()
        if (!text.includes(s) && !source.includes(s)) return false
      }
      if (activeTags.length > 0) {
        const tags = m.tags || []
        if (!activeTags.some((t) => tags.includes(t))) return false
      }
      if (activeMotionType && m.motionType !== activeMotionType) return false
      return true
    })

    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0))
    } else if (sortBy === 'oldest') {
      result.sort((a, b) => (a.updatedAt?.seconds || 0) - (b.updatedAt?.seconds || 0))
    } else if (sortBy === 'a-z') {
      result.sort((a, b) => (a.text || '').localeCompare(b.text || ''))
    }

    return result
  }, [motions, search, activeTags, activeMotionType, sortBy])

  const hasFilters = search.trim() || activeTags.length > 0 || activeMotionType
  const isEmpty = !loading && motions.length === 0
  const isFilteredEmpty = !loading && motions.length > 0 && filtered.length === 0

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Motions</h1>
          <p className="text-sm text-stone-500 mt-1">
            {loading
              ? 'Loading...'
              : hasFilters
              ? `${filtered.length} / ${motions.length} matches`
              : `${motions.length} motion cards`}
          </p>
        </div>
        <Link
          to="/motions/new"
          className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
        >
          + New Motion
        </Link>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Row 1: Search + Sort */}
        <div className="flex gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search motion text..."
            className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-sm"
          />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-sm min-w-[140px]"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="a-z">A-Z</option>
          </select>
        </div>

        {/* Row 2: Motion Type Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveMotionType('')}
            className={
              'px-3 py-1.5 rounded-lg text-sm transition ' +
              (activeMotionType === ''
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 hover:bg-stone-200 text-stone-700')
            }
          >
            All
          </button>
          {MOTION_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveMotionType(t.value)}
              className={
                'px-3 py-1.5 rounded-lg text-sm transition ' +
                (activeMotionType === t.value
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700')
              }
            >
              {t.value}
            </button>
          ))}
        </div>

        {/* Row 3: Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {allTags.slice(0, 20).map((t) => (
              <button
                key={t}
                onClick={() =>
                  setActiveTags((prev) =>
                    prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
                  )
                }
                className={
                  'px-3 py-1 rounded-lg text-xs transition ' +
                  (activeTags.includes(t)
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700')
                }
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {isEmpty && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center">
          <p className="text-stone-500 text-sm">No motions yet. Create your first one!</p>
        </div>
      )}

      {isFilteredEmpty && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center">
          <p className="text-stone-500 text-sm">No matches found.</p>
          <button
            onClick={() => {
              setSearch('')
              setActiveTags([])
              setActiveMotionType('')
            }}
            className="text-xs text-stone-600 hover:text-stone-900 mt-2 underline"
          >
            Clear filters
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
                {m.text || '(No motion text)'}
              </p>
              {m.source && <p className="text-xs text-stone-500">{m.source}</p>}
              {((m.tags && m.tags.length > 0) || m.motionType || m.coreClashes?.length > 0 || m.coreClash || linkedModules.length > 0) && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(m.coreClashes || (m.coreClash ? [m.coreClash] : [])).map((c) => (
                    <span key={c} className="bg-stone-900 text-white rounded-md px-2 py-0.5 text-xs">
                      ⚔️ {c}
                    </span>
                  ))}
                  {m.motionType && (
                    <span className="bg-stone-700 text-white rounded-md px-2 py-0.5 text-xs">
                      {m.motionType}
                    </span>
                  )}
                  {(m.tags || []).slice(0, 5).map((t) => (
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
                  {linkedModules.slice(0, 2).map((mod) => (
                    <span
                      key={mod.id}
                      className="bg-amber-50 text-amber-800 rounded-md px-2 py-0.5 text-xs"
                    >
                      {mod.name_zh || mod.name_en || '(Unnamed)'}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
