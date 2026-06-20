import { useEffect, useState } from 'react'
import BilingualField from './BilingualField'

export default function ModuleFormModal({ open, initial, onSubmit, onCancel }) {
  const [nameEn, setNameEn] = useState('')
  const [nameZh, setNameZh] = useState('')
  const [defEn, setDefEn] = useState('')
  const [defZh, setDefZh] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setNameEn(initial?.name_en || '')
      setNameZh(initial?.name_zh || '')
      setDefEn(initial?.definition_en || '')
      setDefZh(initial?.definition_zh || '')
      setError('')
      setSubmitting(false)
    }
  }, [open, initial])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nameEn.trim() && !nameZh.trim()) {
      setError('请至少填写一个语言的名称')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await onSubmit({
        name_en: nameEn.trim(),
        name_zh: nameZh.trim(),
        definition_en: defEn.trim(),
        definition_zh: defZh.trim(),
      })
    } catch (err) {
      setError(err?.message || '保存失败')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-t-2xl md:rounded-2xl shadow-lg max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{initial ? '编辑模块' : '新增模块'}</h3>
        <BilingualField
          label="名称"
          en={nameEn}
          zh={nameZh}
          onEnChange={setNameEn}
          onZhChange={setNameZh}
        />
        <BilingualField
          label="定义说明"
          en={defEn}
          zh={defZh}
          onEnChange={setDefEn}
          onZhChange={setDefZh}
          multiline
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50"
          >
            {submitting ? '保存中…' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
