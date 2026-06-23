import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import { updateMotion, deleteMotion } from '../data/motions'
import { MOTION_TYPES, SUGGESTED_TAGS } from '../data/debateTaxonomy'
import ArgumentDisplay from '../components/ArgumentDisplay'
import ArgumentEditor from '../components/ArgumentEditor'
import TagInput from '../components/TagInput'
import ModuleMultiSelect from '../components/ModuleMultiSelect'
import ConfirmDialog from '../components/ConfirmDialog'

export default function MotionListPage() {
  const { user } = useAuth()
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
  const [activeCoreClashes, setActiveCoreClashes] = useState([])
  const [expandedMotionId, setExpandedMotionId] = useState(null)
  const [editingMotion, setEditingMotion] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(null)

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

  const allCoreClashes = useMemo(() => {
    const set = new Set()
    motions.forEach((m) => {
      const clashes = m.coreClashes || (m.coreClash ? [m.coreClash] : [])
      clashes.forEach((c) => set.add(c))
    })
    return Array.from(set).sort()
  }, [motions])

  const filtered = useMemo(() => {
    return motions.filter((m) => {
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
      if (activeCoreClashes.length > 0) {
        const clashes = m.coreClashes || (m.coreClash ? [m.coreClash] : [])
        if (!activeCoreClashes.some((c) => clashes.includes(c))) return false
      }
      return true
    })
  }, [motions, search, activeTags, activeMotionType, activeCoreClashes])

  const handleExpand = (motion) => {
    if (expandedMotionId === motion.id) {
      setExpandedMotionId(null)
      setEditingMotion(null)
    } else {
      setExpandedMotionId(motion.id)
      setEditingMotion(JSON.parse(JSON.stringify(motion)))
    }
  }

  const handleSave = async () => {
    if (!editingMotion) return
    setSaving(true)
    try {
      await updateMotion(user.uid, editingMotion.id, editingMotion)
      setExpandedMotionId(null)
      setEditingMotion(null)
    } catch (err) {
      alert('保存失败: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    try {
      await deleteMotion(user.uid, deleting.id)
      setDeleting(null)
      if (expandedMotionId === deleting.id) {
        setExpandedMotionId(null)
        setEditingMotion(null)
      }
    } catch (err) {
      alert('删除失败: ' + (err?.message || ''))
    }
  }

  const updateField = (field, value) => {
    setEditingMotion((prev) => ({ ...prev, [field]: value }))
  }

  const updateArg = (side, index, value) => {
    setEditingMotion((prev) => {
      const args = [...prev[side === 'prop' ? 'propArgs' : 'oppArgs']]
      args[index] = value
      return { ...prev, [side === 'prop' ? 'propArgs' : 'oppArgs']: args }
    })
  }

  const hasFilters = search.trim() || activeTags.length > 0 || activeMotionType || activeCoreClashes.length > 0
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
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search motion text or source..."
          className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm"
        />
        <div className="flex flex-wrap gap-2">
          {allTags.slice(0, 15).map((t) => (
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
              setActiveCoreClashes([])
            }}
            className="text-xs text-stone-600 hover:text-stone-900 mt-2 underline"
          >
            Clear filters
          </button>
        </div>
      )}

      <div className="space-y-3">
        {filtered.map((m) => {
          const linkedModules = (m.linkedModuleIds || [])
            .map((mid) => moduleMap[mid])
            .filter(Boolean)
          const isExpanded = expandedMotionId === m.id
          const editing = isExpanded ? editingMotion : null

          return (
            <div key={m.id} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
              <div
                onClick={() => handleExpand(m)}
                className="p-4 cursor-pointer hover:bg-stone-50 transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium leading-snug">
                      {m.text || '(No motion text)'}
                    </p>
                    {m.source && <p className="text-xs text-stone-500 mt-1">{m.source}</p>}
                  </div>
                  <div className="text-stone-400">
                    {isExpanded ? '▲' : '▼'}
                  </div>
                </div>
                {((m.tags && m.tags.length > 0) || m.motionType || m.coreClashes?.length > 0 || m.coreClash) && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
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
                      <span key={t} className="bg-stone-100 text-stone-700 rounded-md px-2 py-0.5 text-xs">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {isExpanded && editing && (
                <div className="border-t border-stone-200 p-4 space-y-4 bg-stone-50/50">
                  {/* Basic Info - Collapsible */}
                  <details className="group">
                    <summary className="cursor-pointer font-semibold text-sm list-none flex items-center justify-between">
                      <span>Basic Info</span>
                      <span className="group-open:rotate-180 transition-transform">▼</span>
                    </summary>
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="text-sm font-medium text-stone-700">Motion Text</label>
                        <textarea
                          value={editing.text}
                          onChange={(e) => updateField('text', e.target.value)}
                          rows={2}
                          className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Source</label>
                        <input
                          value={editing.source || ''}
                          onChange={(e) => updateField('source', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Motion Type</label>
                        <select
                          value={editing.motionType || ''}
                          onChange={(e) => updateField('motionType', e.target.value)}
                          className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        >
                          <option value="">-- None --</option>
                          {MOTION_TYPES.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Tags</label>
                        <TagInput
                          value={editing.tags || []}
                          onChange={(v) => updateField('tags', v)}
                          suggestions={SUGGESTED_TAGS}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Core Clash</label>
                        <TagInput
                          value={editing.coreClashes || []}
                          onChange={(v) => updateField('coreClashes', v)}
                          suggestions={allCoreClashes}
                          placeholder="e.g. Innovation vs Safety"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Linked Frameworks</label>
                        <ModuleMultiSelect
                          modules={modules}
                          value={editing.linkedModuleIds || []}
                          onChange={(v) => updateField('linkedModuleIds', v)}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-stone-700">Characterization / Status Quo</label>
                        <textarea
                          value={editing.characterization || ''}
                          onChange={(e) => updateField('characterization', e.target.value)}
                          rows={2}
                          className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </details>

                  {/* Arguments - Expanded by Default */}
                  <section className="space-y-3">
                    <h3 className="font-semibold text-sm">Proposition</h3>
                    {(editing.propArgs || []).map((a, i) => (
                      <ArgumentEditor
                        key={i}
                        index={i}
                        side="prop"
                        value={a}
                        onChange={(v) => updateArg('prop', i, v)}
                      />
                    ))}
                  </section>

                  <section className="space-y-3">
                    <h3 className="font-semibold text-sm">Opposition</h3>
                    {(editing.oppArgs || []).map((a, i) => (
                      <ArgumentEditor
                        key={i}
                        index={i}
                        side="opp"
                        value={a}
                        onChange={(v) => updateArg('opp', i, v)}
                      />
                    ))}
                  </section>

                  {/* Post-Round Review */}
                  <section className="space-y-3 border-t pt-4">
                    <h3 className="font-semibold text-sm">Post-Round Review</h3>
                    <div>
                      <label className="text-sm font-medium text-stone-700">Adjudicator Feedback</label>
                      <textarea
                        value={editing.postRoundReview?.adjudicatorFeedback || ''}
                        onChange={(e) =>
                          updateField('postRoundReview', {
                            ...editing.postRoundReview,
                            adjudicatorFeedback: e.target.value,
                          })
                        }
                        rows={3}
                        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        placeholder="Notes from judge's feedback..."
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-stone-700">Next Improvement</label>
                      <textarea
                        value={editing.postRoundReview?.nextImprovement || ''}
                        onChange={(e) =>
                          updateField('postRoundReview', {
                            ...editing.postRoundReview,
                            nextImprovement: e.target.value,
                          })
                        }
                        rows={2}
                        className="w-full mt-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
                        placeholder="What to improve next time..."
                      />
                    </div>
                  </section>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-4 border-t">
                    <button
                      onClick={() => setDeleting(m)}
                      className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
                    >
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setExpandedMotionId(null)
                        setEditingMotion(null)
                      }}
                      className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800 disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {deleting && (
        <ConfirmDialog
          title="Delete Motion"
          message={`Are you sure you want to delete "${deleting.text}"?`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
