import BilingualField from './BilingualField'
import PoiEditor from './PoiEditor'

const FIELDS = [
  { key: 'claim', label: 'Claim 论点' },
  { key: 'mechanism', label: 'Mechanism 机制' },
  { key: 'comparative', label: 'Comparative 比较' },
  { key: 'impact', label: 'Impact 影响' },
]

export default function ArgumentEditor({ index, side, value, onChange }) {
  const update = (field, lang, v) => {
    onChange({ ...value, [`${field}_${lang}`]: v })
  }
  const updatePois = (pois) => onChange({ ...value, pois })

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50/40 p-4 space-y-3">
      <div className="text-sm font-medium text-stone-700">
        {side === 'prop' ? '正方' : '反方'}论点 {index + 1}
      </div>
      <div className="space-y-3">
        {FIELDS.map((f) => (
          <BilingualField
            key={f.key}
            label={f.label}
            en={value[`${f.key}_en`] || ''}
            zh={value[`${f.key}_zh`] || ''}
            onEnChange={(v) => update(f.key, 'en', v)}
            onZhChange={(v) => update(f.key, 'zh', v)}
            multiline
          />
        ))}
        <PoiEditor pois={value.pois || []} onChange={updatePois} />
      </div>
    </div>
  )
}
