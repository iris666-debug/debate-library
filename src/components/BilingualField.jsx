export default function BilingualField({
  label,
  en,
  zh,
  onEnChange,
  onZhChange,
  multiline = false,
  enPlaceholder = 'English',
  zhPlaceholder = '中文',
}) {
  const className =
    'w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none'

  return (
    <div className="space-y-2">
      {label && <span className="text-sm text-stone-700 font-medium">{label}</span>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {multiline ? (
          <>
            <textarea
              value={en}
              onChange={(e) => onEnChange(e.target.value)}
              rows={3}
              placeholder={enPlaceholder}
              className={className + ' resize-y'}
            />
            <textarea
              value={zh}
              onChange={(e) => onZhChange(e.target.value)}
              rows={3}
              placeholder={zhPlaceholder}
              className={className + ' resize-y'}
            />
          </>
        ) : (
          <>
            <input
              type="text"
              value={en}
              onChange={(e) => onEnChange(e.target.value)}
              placeholder={enPlaceholder}
              className={className}
            />
            <input
              type="text"
              value={zh}
              onChange={(e) => onZhChange(e.target.value)}
              placeholder={zhPlaceholder}
              className={className}
            />
          </>
        )}
      </div>
    </div>
  )
}
