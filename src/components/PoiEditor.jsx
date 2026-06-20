import BilingualField from './BilingualField'

export default function PoiEditor({ pois = [], onChange }) {
  const add = () =>
    onChange([
      ...pois,
      { question_en: '', question_zh: '', answer_en: '', answer_zh: '' },
    ])
  const update = (i, p) =>
    onChange(pois.map((x, idx) => (idx === i ? p : x)))
  const remove = (i) => onChange(pois.filter((_, idx) => idx !== i))

  return (
    <details className="rounded-lg border border-stone-200 bg-white">
      <summary className="cursor-pointer px-3 py-2 flex items-center justify-between text-sm hover:bg-stone-50 list-none [&::-webkit-details-marker]:hidden rounded-lg">
        <span className="font-medium text-stone-700">
          POIs <span className="text-stone-400 font-normal">({pois.length})</span>
        </span>
        <span className="text-xs text-stone-400">展开管理</span>
      </summary>
      <div className="px-3 pb-3 pt-2 space-y-3 border-t border-stone-100">
        {pois.length === 0 && (
          <p className="text-xs text-stone-400">还没有 POI。点下方按钮添加。</p>
        )}
        {pois.map((p, i) => (
          <div
            key={i}
            className="rounded-lg border border-stone-200 p-3 space-y-2 bg-stone-50/50"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs text-stone-500 font-medium">POI {i + 1}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-xs text-red-600 hover:text-red-700"
              >
                删除
              </button>
            </div>
            <BilingualField
              label="问题"
              en={p.question_en || ''}
              zh={p.question_zh || ''}
              onEnChange={(v) => update(i, { ...p, question_en: v })}
              onZhChange={(v) => update(i, { ...p, question_zh: v })}
              multiline
            />
            <BilingualField
              label="参考答案"
              en={p.answer_en || ''}
              zh={p.answer_zh || ''}
              onEnChange={(v) => update(i, { ...p, answer_en: v })}
              onZhChange={(v) => update(i, { ...p, answer_zh: v })}
              multiline
            />
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="w-full px-3 py-2 rounded-lg border border-dashed border-stone-300 text-sm text-stone-600 hover:bg-stone-100"
        >
          + 新增 POI
        </button>
      </div>
    </details>
  )
}
