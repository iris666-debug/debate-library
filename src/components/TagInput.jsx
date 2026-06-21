import { useState, useId } from 'react'

export default function TagInput({ value = [], onChange, placeholder = '输入标签后回车添加', suggestions = [] }) {
  const [input, setInput] = useState('')
  const listId = useId()

  const addTag = (raw) => {
    const t = raw.trim()
    if (!t) return
    if (value.includes(t)) {
      setInput('')
      return
    }
    onChange([...value, t])
    setInput('')
  }

  const removeTag = (t) => {
    onChange(value.filter((x) => x !== t))
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
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
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => addTag(input)}
        placeholder={value.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[120px] outline-none text-sm py-1 bg-transparent"
        list={suggestions.length > 0 ? listId : undefined}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions
            .filter((s) => !value.includes(s))
            .map((s) => (
              <option key={s} value={s} />
            ))}
        </datalist>
      )}
    </div>
  )
}
