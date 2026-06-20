export default function ModuleMultiSelect({ modules, value = [], onChange }) {
  const toggle = (id) => {
    if (value.includes(id)) onChange(value.filter((x) => x !== id))
    else onChange([...value, id])
  }

  if (modules.length === 0) {
    return (
      <p className="text-sm text-stone-400">
        还没有模块。先去 <span className="text-stone-700">"模块"</span> 标签页建几个模块,再回来关联。
      </p>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {modules.map((m) => {
        const checked = value.includes(m.id)
        const label = m.name_zh || m.name_en || '(未命名)'
        const sub = m.name_zh && m.name_en ? m.name_en : ''
        return (
          <label
            key={m.id}
            className={
              'flex items-start gap-2 rounded-lg border p-2.5 cursor-pointer text-sm transition ' +
              (checked
                ? 'border-stone-900 bg-stone-50'
                : 'border-stone-200 hover:border-stone-400')
            }
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(m.id)}
              className="mt-0.5"
            />
            <span className="flex-1 min-w-0">
              <span className="block leading-tight">{label}</span>
              {sub && <span className="block text-xs text-stone-400 leading-tight">{sub}</span>}
            </span>
          </label>
        )
      })}
    </div>
  )
}
