import { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import {
  exportAllData,
  downloadJson,
  validateBackup,
  importData,
  getCurrentCounts,
} from '../data/backup'

export default function DataPage() {
  const { user } = useAuth()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  const [pending, setPending] = useState(null) // {file, parsed, currentCounts}
  const [mode, setMode] = useState('merge')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState('')
  const [importDone, setImportDone] = useState(null)

  const handleExport = async () => {
    setExporting(true)
    setExportError('')
    try {
      const data = await exportAllData(user.uid)
      const stamp = new Date().toISOString().slice(0, 10)
      downloadJson(`debate-library-${stamp}.json`, data)
    } catch (err) {
      setExportError(err?.message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setImportError('')
    setImportDone(null)
    try {
      const text = await file.text()
      let parsed
      try {
        parsed = JSON.parse(text)
      } catch {
        throw new Error('文件不是有效的 JSON 格式,无法读取')
      }
      const valid = validateBackup(parsed)
      const currentCounts = await getCurrentCounts(user.uid)
      setPending({ file, parsed: valid, currentCounts })
      setMode('merge')
    } catch (err) {
      setImportError(err?.message || '读取文件失败')
    }
  }

  const cancelImport = () => {
    setPending(null)
    setImportError('')
  }

  const confirmImport = async () => {
    if (!pending) return
    setImporting(true)
    setImportError('')
    try {
      const result = await importData(user.uid, pending.parsed, mode)
      setImportDone(result)
      setPending(null)
    } catch (err) {
      setImportError(err?.message || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  const hasCurrentData =
    pending &&
    pending.currentCounts.moduleCount + pending.currentCounts.motionCount > 0

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">数据管理</h1>
        <p className="text-sm text-stone-500 mt-1">
          云端数据自动同步。这里可以另外做本地 JSON 备份和恢复。
        </p>
      </div>

      <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold">导出备份</h2>
        <p className="text-sm text-stone-600">
          把所有题卡和模块下载成一个 JSON 文件,妥善保管。
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50"
        >
          {exporting ? '导出中…' : '导出 JSON'}
        </button>
        {exportError && (
          <p className="text-sm text-red-600">{exportError}</p>
        )}
      </section>

      <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold">导入恢复</h2>
        <p className="text-sm text-stone-600">
          从 JSON 备份文件恢复数据。导入前会让你预览并选择模式。
        </p>
        {!pending && (
          <label className="inline-block px-4 py-2 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 cursor-pointer">
            选择 JSON 文件
            <input
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}
        {importError && <p className="text-sm text-red-600">{importError}</p>}

        {pending && (
          <ImportPreview
            pending={pending}
            mode={mode}
            setMode={setMode}
            hasCurrentData={hasCurrentData}
            importing={importing}
            onCancel={cancelImport}
            onConfirm={confirmImport}
          />
        )}

        {importDone && (
          <div className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
            导入完成:{importDone.moduleCount} 个模块,{importDone.motionCount} 张题卡。
          </div>
        )}
      </section>
    </div>
  )
}

function ImportPreview({
  pending,
  mode,
  setMode,
  hasCurrentData,
  importing,
  onCancel,
  onConfirm,
}) {
  const { parsed, currentCounts } = pending
  return (
    <div className="rounded-lg border border-stone-200 p-4 space-y-3 bg-stone-50/60">
      <div className="text-sm space-y-1">
        <p>
          文件包含:<span className="font-medium">{parsed.modules.length}</span>{' '}
          个模块,<span className="font-medium">{parsed.motions.length}</span>{' '}
          张题卡
        </p>
        {parsed.exportedAt && (
          <p className="text-xs text-stone-500">
            备份时间:{new Date(parsed.exportedAt).toLocaleString('zh-CN')}
          </p>
        )}
        <p>
          当前数据:{currentCounts.moduleCount} 个模块,
          {currentCounts.motionCount} 张题卡
        </p>
      </div>

      {hasCurrentData && (
        <div className="space-y-2">
          <p className="text-sm font-medium">导入模式</p>
          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="merge"
              checked={mode === 'merge'}
              onChange={() => setMode('merge')}
              className="mt-1"
            />
            <span className="flex-1">
              <span className="text-sm font-medium">合并</span>
              <span className="block text-xs text-stone-500 mt-0.5">
                导入数据加到现有数据后面,不影响已有内容。
              </span>
            </span>
          </label>
          <label className="flex items-start gap-2 p-2.5 rounded-lg border border-stone-200 bg-white cursor-pointer">
            <input
              type="radio"
              name="mode"
              value="overwrite"
              checked={mode === 'overwrite'}
              onChange={() => setMode('overwrite')}
              className="mt-1"
            />
            <span className="flex-1">
              <span className="text-sm font-medium text-red-700">覆盖</span>
              <span className="block text-xs text-stone-500 mt-0.5">
                先删除当前所有数据,再导入。无法恢复。
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2">
        <button
          onClick={onCancel}
          disabled={importing}
          className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100 disabled:opacity-50"
        >
          取消
        </button>
        <button
          onClick={onConfirm}
          disabled={importing}
          className={
            'px-4 py-1.5 rounded-lg text-sm text-white disabled:opacity-50 ' +
            (mode === 'overwrite' && hasCurrentData
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-stone-900 hover:bg-stone-800')
          }
        >
          {importing
            ? '导入中…'
            : mode === 'overwrite' && hasCurrentData
            ? '确认覆盖导入'
            : '确认导入'}
        </button>
      </div>
    </div>
  )
}
