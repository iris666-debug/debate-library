import { useState } from 'react'
import BilingualField from './BilingualField'

export default function MechanismEditor({ value, onChange }) {
  // value 格式: { mechanism_en: '', mechanism_zh: '', mechanism_points: [] }
  // 向后兼容：如果 mechanism_points 为空但有旧字段，显示为第1步
  const [points, setPoints] = useState(() => {
    if (value.mechanism_points && value.mechanism_points.length > 0) {
      return value.mechanism_points
    }
    // 兼容旧数据
    if (value.mechanism_en || value.mechanism_zh) {
      return [{ text_en: value.mechanism_en || '', text_zh: value.mechanism_zh || '' }]
    }
    return []
  })

  const updatePoints = (newPoints) => {
    setPoints(newPoints)
    onChange({
      ...value,
      mechanism_points: newPoints,
      // 清空旧字段，避免混淆
      mechanism_en: '',
      mechanism_zh: '',
    })
  }

  const addPoint = () => {
    updatePoints([...points, { text_en: '', text_zh: '' }])
  }

  const removePoint = (index) => {
    updatePoints(points.filter((_, i) => i !== index))
  }

  const moveUp = (index) => {
    if (index === 0) return
    const newPoints = [...points]
    ;[newPoints[index - 1], newPoints[index]] = [newPoints[index], newPoints[index - 1]]
    updatePoints(newPoints)
  }

  const moveDown = (index) => {
    if (index === points.length - 1) return
    const newPoints = [...points]
    ;[newPoints[index], newPoints[index + 1]] = [newPoints[index + 1], newPoints[index]]
    updatePoints(newPoints)
  }

  const updatePoint = (index, field, val) => {
    const newPoints = [...points]
    newPoints[index] = { ...newPoints[index], [field]: val }
    updatePoints(newPoints)
  }

  return (
    <div className="space-y-3">
      {points.length === 0 && (
        <p className="text-xs text-stone-400">还没有推理步骤，点下方"+ 新增一步"开始</p>
      )}
      {points.map((p, i) => (
        <div key={i} className="border border-stone-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-600">第 {i + 1} 步</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="px-2 py-0.5 text-xs text-stone-600 hover:text-stone-900 disabled:opacity-30"
                title="上移"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveDown(i)}
                disabled={i === points.length - 1}
                className="px-2 py-0.5 text-xs text-stone-600 hover:text-stone-900 disabled:opacity-30"
                title="下移"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => removePoint(i)}
                className="px-2 py-0.5 text-xs text-red-600 hover:text-red-800"
                title="删除"
              >
                ×
              </button>
            </div>
          </div>
          <BilingualField
            valueEn={p.text_en}
            valueZh={p.text_zh}
            onChangeEn={(v) => updatePoint(i, 'text_en', v)}
            onChangeZh={(v) => updatePoint(i, 'text_zh', v)}
            placeholderEn={`Step ${i + 1} (English)`}
            placeholderZh={`第 ${i + 1} 步（中文）`}
          />
        </div>
      ))}
      <button
        type="button"
        onClick={addPoint}
        className="w-full px-3 py-2 border border-dashed border-stone-300 rounded-lg text-xs text-stone-600 hover:bg-stone-50"
      >
        + 新增一步
      </button>
    </div>
  )
}
