import { useState, useRef, useEffect, useMemo } from 'react'

export default function TagInput({
  value = [],
  onChange,
  placeholder = '输入标签后回车添加，或从下方选择',
  suggestions = [],
}) {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const wrapRef = useRef(null)

  // 点击外部时收起下拉面板
  useEffect(() => {
    const onClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = useMemo(() => {
    const pool = suggestions.filter((s) => !value.includes(s))
    if (!input.trim()) return pool
    const q = input.trim().toLowerCase()
    return pool.filter((s) => s.toLowerCase().includes(q))
  }, [suggestions, value, input])

  const addTag = (raw) => {
    const t = raw.trim()
    if (!t) return
    if (!value.includes(t)) {
      onChange([...value, t])
    }
    setInput('')
    setHighlight(0)
  }

  const removeTag = (t) => {
    onChange(value.filter((x) => x !== t))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (open && filtered.length > 0 && filtered[highlight] !== undefined) {
        addTag(filtered[highlight])
      } else {
        addTag(input)
      }
    } else if (e.key === ',' || e.key === '，') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setOpen(true)
      setHighlight((h) => Math.min(h + 1, Math.max(filtered.length - 1, 0)))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <div className="rounded-lg border border-stone-300 px-2 py-1.5 flex flex-wrap gap-1.5 focus-within:border-stone-900">
        {value.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-1 bg-stone-100 text-stone-700 rounded-md px-2 py-0.5 text-xs"
          >
            {t}
            <button
              type="button"
              onClick={() => removeTag(t)}
              className="text-stone-400 hover:text-stone-700"
              aria-label={`移除 ${t}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setHighlight(0)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm py-1 bg-transparent"
        />
        {suggestions.length > 0 && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="text-stone-400 hover:text-stone-700 px-1 text-xs shrink-0"
            aria-label="展开推荐标签"
          >
            {open ? '▲' : '▼'}
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-stone-200 bg-white shadow-lg">
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-stone-400">
              没有匹配项，按回车直接添加自定义标签 "{input}"
            </div>
          ) : (
            <ul>
              {filtered.map((s, i) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => addTag(s)}
                    onMouseEnter={() => setHighlight(i)}
                    className={
                      'w-full text-left px-3 py-1.5 text-sm transition ' +
                      (i === highlight
                        ? 'bg-stone-100 text-stone-900'
                        : 'text-stone-600 hover:bg-stone-50')
                    }
                  >
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
