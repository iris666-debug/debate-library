import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import { createModule, updateModule, deleteModule } from '../data/modules'
import ModuleFormModal from '../components/ModuleFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ModuleListPage() {
  const { user } = useAuth()
  const { items: modules, loading, error } = useUserCollection('modules', {
    orderBy: 'createdAt',
    orderDir: 'asc',
  })
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const handleSubmit = async (data) => {
    if (editing && editing.id) {
      await updateModule(user.uid, editing.id, data)
    } else {
      await createModule(user.uid, data)
    }
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteModule(user.uid, deleting.id)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">万能模块库</h1>
          <p className="text-sm text-stone-500 mt-1">
            {loading ? '加载中…' : `共 ${modules.length} 个模块`}
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="px-4 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
        >
          + 新增模块
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          加载失败:{error.message}
        </div>
      )}

      {!loading && modules.length === 0 && (
        <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-12 text-center">
          <p className="text-stone-500 text-sm">还没有模块。点上方"新增模块"开始添加。</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modules.map((m) => (
          <article
            key={m.id}
            className="bg-white border border-stone-200 rounded-2xl flex flex-col overflow-hidden"
          >
            <Link
              to={`/modules/${m.id}`}
              className="p-5 space-y-3 flex-1 hover:bg-stone-50 transition"
            >
              <header className="space-y-0.5">
                <h3 className="font-semibold leading-snug">
                  {m.name_zh || m.name_en || '(未命名)'}
                </h3>
                {m.name_en && m.name_zh && (
                  <p className="text-xs text-stone-400 leading-snug">{m.name_en}</p>
                )}
              </header>

              {(m.definition_zh || m.definition_en) && (
                <div className="text-sm space-y-2 leading-relaxed">
                  {m.definition_zh && (
                    <p className="text-stone-700 whitespace-pre-wrap">{m.definition_zh}</p>
                  )}
                  {m.definition_en && (
                    <p className="text-stone-400 whitespace-pre-wrap text-xs">
                      {m.definition_en}
                    </p>
                  )}
                </div>
              )}
            </Link>

            <footer className="flex gap-3 px-5 py-3 border-t border-stone-100">
              <button
                onClick={() => setEditing(m)}
                className="text-sm text-stone-600 hover:text-stone-900"
              >
                编辑
              </button>
              <button
                onClick={() => setDeleting(m)}
                className="text-sm text-red-600 hover:text-red-700"
              >
                删除
              </button>
              <Link
                to={`/modules/${m.id}`}
                className="text-sm text-stone-500 hover:text-stone-900 ml-auto"
              >
                查看引用 →
              </Link>
            </footer>
          </article>
        ))}
      </div>

      <ModuleFormModal
        open={editing !== null}
        initial={editing && editing.id ? editing : null}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />
      <ConfirmDialog
        open={deleting !== null}
        title="删除模块?"
        message={
          deleting
            ? `「${deleting.name_zh || deleting.name_en || '未命名'}」将被永久删除。如果有题卡引用此模块,题卡上的引用会一并清除(题卡本身不会被删)。此操作无法恢复。`
            : ''
        }
        confirmLabel="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  )
}
