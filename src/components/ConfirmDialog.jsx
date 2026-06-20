import { useEffect } from 'react'

export default function ConfirmDialog({
  open,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = '确认',
  cancelLabel = '取消',
  danger = false,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-lg max-w-sm w-full p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && <p className="text-sm text-stone-600 leading-relaxed">{message}</p>}
        <div className="flex gap-2 justify-end pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={
              'px-4 py-1.5 rounded-lg text-sm text-white ' +
              (danger ? 'bg-red-600 hover:bg-red-700' : 'bg-stone-900 hover:bg-stone-800')
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
