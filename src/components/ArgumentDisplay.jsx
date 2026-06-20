const FIELDS = [
  { key: 'claim', label: 'Claim 论点' },
  { key: 'mechanism', label: 'Mechanism 机制' },
  { key: 'comparative', label: 'Comparative 比较' },
  { key: 'impact', label: 'Impact 影响' },
]

export default function ArgumentDisplay({ index, side, value }) {
  const filled = FIELDS.some(
    (f) => value[`${f.key}_en`] || value[`${f.key}_zh`]
  )

  return (
    <details
      open
      className="rounded-xl border border-stone-200 bg-white group"
    >
      <summary className="cursor-pointer px-4 py-3 flex items-center justify-between text-sm hover:bg-stone-50 list-none [&::-webkit-details-marker]:hidden rounded-xl">
        <span className="font-medium">
          {side === 'prop' ? '正方' : '反方'}论点 {index + 1}
          {!filled && (
            <span className="ml-2 text-xs text-stone-400 font-normal">(空)</span>
          )}
        </span>
        <span className="text-stone-300 text-xs select-none transition group-open:rotate-180">
          ▾
        </span>
      </summary>
      <div className="px-4 pb-4 pt-1 space-y-4 border-t border-stone-100">
        {filled ? (
          FIELDS.map((f) => {
            const en = value[`${f.key}_en`]
            const zh = value[`${f.key}_zh`]
            if (!en && !zh) return null
            return (
              <div key={f.key} className="space-y-1.5 pt-3">
                <div className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
                  {f.label}
                </div>
                {en && (
                  <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                    {en}
                  </p>
                )}
                {zh && (
                  <p className="text-sm text-stone-500 whitespace-pre-wrap leading-relaxed">
                    {zh}
                  </p>
                )}
              </div>
            )
          })
        ) : (
          <p className="text-xs text-stone-400 pt-3">(此论点未填写内容)</p>
        )}
      </div>
    </details>
  )
}
