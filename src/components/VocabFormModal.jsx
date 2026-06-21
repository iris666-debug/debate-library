import { useState, useEffect } from 'react'
import MotionMultiSelect from './MotionMultiSelect'

export default function VocabFormModal({ item, motions, onSave, onClose }) {
  const [form, setForm] = useState({
    term_en: '',
    meaning_zh: '',
    usage_note: '',
    linkedMotionIds: [],
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        term_en: item.term_en || '',
        meaning_zh: item.meaning_zh || '',
        usage_note: item.usage_note || '',
        linkedMotionIds: item.linkedMotionIds || [],
      })
    }
  }, [item])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.term_en.trim()) {
      setError('英文词汇不能为空')
      return
    }
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err?.message || '保存失败')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <form
        className="bg-white rounded-2xl p-6 max-w-xl w-full max-h-[90vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
      >
        <h2 className="text-xl font-semibold">
          {item ? '编辑词汇' : '新增词汇'}
        </h2>
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
            {error}
          </div>
        )}
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">
            英文词汇/短语 <span className="text-red-500">*</span>
          </span>
          <input
            type="text"
            value={form.term_en}
            onChange={(e) => setForm({ ...form, term_en: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded"
            placeholder="power asymmetry"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">中文释义</span>
          <input
            type="text"
            value={form.meaning_zh}
            onChange={(e) => setForm({ ...form, meaning_zh: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded"
            placeholder="权力失衡"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">辩论语境用法说明</span>
          <textarea
            value={form.usage_note}
            onChange={(e) => setForm({ ...form, usage_note: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-stone-300 rounded resize-none"
            placeholder="用一句话说明这个词/短语在辩论里通常怎么用"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">从哪张题卡学到的（可选）</span>
          <MotionMultiSelect
            motions={motions}
            value={form.linkedMotionIds}
            onChange={(ids) => setForm({ ...form, linkedMotionIds: ids })}
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
            disabled={saving}
          >
            取消
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50"
            disabled={saving}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
