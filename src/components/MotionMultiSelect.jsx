import { useState, useMemo } from 'react'

export default function MotionMultiSelect({ motions, value, onChange }) {
  const [search, setSearch] = useState('')

  const selected = useMemo(() => {
    return motions.filter((m) => value.includes(m.id))
  }, [motions, value])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return motions.slice(0, 30)
    return motions
      .filter((m) => m.text.toLowerCase().includes(query))
      .slice(0, 30)
  }, [motions, search])

  const toggle = (id) => {
    if (value.includes(id)) {
      onChange(value.filter((x) => x !== id))
    } else {
      onChange([...value, id])
    }
  }

  if (motions.length === 0) {
    return (
      <div className="text-xs text-stone-400 py-2">
        还没有题卡，先去题库建几张题卡，再回来关联
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((m) => (
            <span
              key={m.id}
              className="bg-stone-700 text-white rounded px-2 py-0.5 text-xs inline-flex items-center gap-1"
            >
              {m.text.slice(0, 50)}
              {m.text.length > 50 && '...'}
              <button
                type="button"
                onClick={() => toggle(m.id)}
                className="hover:text-red-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        placeholder="搜索题卡..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-3 py-1.5 text-sm border border-stone-300 rounded"
      />
      <div className="max-h-48 overflow-y-auto border border-stone-200 rounded p-2 space-y-1.5">
        {filtered.map((m) => {
          const checked = value.includes(m.id)
          return (
            <label
              key={m.id}
              className="flex items-start gap-2 text-sm cursor-pointer hover:bg-stone-50 p-1 rounded"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggle(m.id)}
                className="mt-0.5 shrink-0"
              />
              <span className={checked ? 'text-stone-900' : 'text-stone-600'}>
                {m.text}
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
