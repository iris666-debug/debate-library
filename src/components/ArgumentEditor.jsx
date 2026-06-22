import BilingualField from './BilingualField'
import MechanismEditor from './MechanismEditor'
import PoiEditor from './PoiEditor'

const FIELDS = [
  { key: 'claim', label: 'Claim 论点' },
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
        <BilingualField
          label="论点名称 Argument Name"
          en={value.name_en || ''}
          zh={value.name_zh || ''}
          onEnChange={(v) => update('name', 'en', v)}
          onZhChange={(v) => update('name', 'zh', v)}
        />
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
        <div>
          <div className="text-sm font-medium text-stone-700 mb-2">Mechanism 机制（拆步骤）</div>
          <MechanismEditor value={value} onChange={onChange} />
        </div>
        <PoiEditor pois={value.pois || []} onChange={updatePois} />
      </div>
    </div>
  )
}
