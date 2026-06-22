import SpeakButton from './SpeakButton'

const FIELDS = [
  { key: 'claim', label: 'Claim 论点' },
  { key: 'comparative', label: 'Comparative 比较' },
  { key: 'impact', label: 'Impact 影响' },
]

export default function ArgumentDisplay({ index, side, value }) {
  // 兼容 mechanism 新旧两种格式
  const hasMechanism =
    (value.mechanism_points && value.mechanism_points.length > 0) ||
    value.mechanism_en ||
    value.mechanism_zh

  const filled = FIELDS.some(
    (f) => value[`${f.key}_en`] || value[`${f.key}_zh`]
  ) || hasMechanism

  const sidePrefix = `${side === 'prop' ? '正方' : '反方'} ${index + 1}`
  const nameEn = value.name_en?.trim()
  const nameZh = value.name_zh?.trim()
  const namePart = nameEn && nameZh ? `${nameEn} / ${nameZh}` : nameEn || nameZh
  const titleText = namePart
    ? `${sidePrefix} · ${namePart}`
    : `${side === 'prop' ? '正方' : '反方'}论点 ${index + 1}`

  return (
    <details
      open
      className="rounded-xl border border-stone-200 bg-white group"
    >
      <summary className="cursor-pointer px-4 py-3 flex items-center justify-between text-sm hover:bg-stone-50 list-none [&::-webkit-details-marker]:hidden rounded-xl">
        <span className="font-medium">
          {titleText}
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
          <>
            {FIELDS.map((f) => {
              const en = value[`${f.key}_en`]
              const zh = value[`${f.key}_zh`]
              if (!en && !zh) return null
              return (
                <div key={f.key} className="space-y-1.5 pt-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
                      {f.label}
                    </div>
                    {en && <SpeakButton text={en} rate={0.85} label="" />}
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
            })}
            {/* Mechanism 特殊处理：支持拆步骤 */}
            {hasMechanism && (
              <div className="space-y-1.5 pt-3">
                <div className="text-xs uppercase tracking-wide text-stone-500 font-semibold">
                  Mechanism 机制
                </div>
                {value.mechanism_points && value.mechanism_points.length > 0 ? (
                  <ol className="space-y-2">
                    {value.mechanism_points.map((p, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-xs font-semibold text-stone-500 shrink-0">
                          {i + 1}.
                        </span>
                        <div className="flex-1 space-y-1">
                          {p.text_en && (
                            <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                              {p.text_en}
                            </p>
                          )}
                          {p.text_zh && (
                            <p className="text-sm text-stone-500 whitespace-pre-wrap leading-relaxed">
                              {p.text_zh}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="space-y-1">
                    {value.mechanism_en && (
                      <p className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                        {value.mechanism_en}
                      </p>
                    )}
                    {value.mechanism_zh && (
                      <p className="text-sm text-stone-500 whitespace-pre-wrap leading-relaxed">
                        {value.mechanism_zh}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-xs text-stone-400 pt-3">(此论点未填写内容)</p>
        )}
      </div>
    </details>
  )
}
