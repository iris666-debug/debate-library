import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import {
  getModule,
  getMotionsLinkedToModule,
  updateModule,
  deleteModule,
} from '../data/modules'
import ModuleFormModal from '../components/ModuleFormModal'
import ConfirmDialog from '../components/ConfirmDialog'

export default function ModuleDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [module, setModule] = useState(null)
  const [motions, setMotions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const [m, ms] = await Promise.all([
        getModule(user.uid, id),
        getMotionsLinkedToModule(user.uid, id),
      ])
      if (!m) {
        setError('模块不存在或已被删除')
      } else {
        setModule(m)
        setMotions(ms)
      }
    } catch (err) {
      setError(err?.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id, user?.uid])

  const handleEditSubmit = async (data) => {
    await updateModule(user.uid, id, data)
    setEditing(false)
    load()
  }

  const handleDelete = async () => {
    await deleteModule(user.uid, id)
    navigate('/modules')
  }

  if (loading) return <div className="text-sm text-stone-400">加载中…</div>

  if (error)
    return (
      <div className="space-y-4">
        <Link to="/modules" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回模块库
        </Link>
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      </div>
    )

  if (!module) return null

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/modules" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回模块库
        </Link>
        <div className="flex gap-2">
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
          >
            编辑
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50"
          >
            删除
          </button>
        </div>
      </div>

      <header className="space-y-1.5">
        <h1 className="text-2xl font-semibold leading-snug">
          {module.name_zh || module.name_en || '(未命名)'}
        </h1>
        {module.name_en && module.name_zh && (
          <p className="text-sm text-stone-400">{module.name_en}</p>
        )}
      </header>

      {(module.definition_zh || module.definition_en) && (
        <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
          {module.definition_zh && (
            <p className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
              {module.definition_zh}
            </p>
          )}
          {module.definition_en && (
            <p className="text-sm text-stone-400 whitespace-pre-wrap leading-relaxed">
              {module.definition_en}
            </p>
          )}
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">
          引用此模块的题卡{' '}
          <span className="text-sm text-stone-400 font-normal">
            ({motions.length})
          </span>
        </h2>
        {motions.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center">
            <p className="text-stone-500 text-sm">还没有题卡引用此模块。</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {motions.map((m) => (
              <li key={m.id}>
                <Link
                  to={`/motions/${m.id}`}
                  className="block bg-white border border-stone-200 rounded-xl p-4 hover:border-stone-400 hover:shadow-sm transition"
                >
                  <p className="font-medium leading-snug">
                    {m.text || '(无 Motion 文本)'}
                  </p>
                  {m.source && (
                    <p className="text-xs text-stone-500 mt-0.5">{m.source}</p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModuleFormModal
        open={editing}
        initial={module}
        onSubmit={handleEditSubmit}
        onCancel={() => setEditing(false)}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="删除模块?"
        message={
          motions.length > 0
            ? `「${module.name_zh || module.name_en}」被 ${motions.length} 张题卡引用。删除后,这些题卡上的引用会一并清除(题卡本身不会被删)。此操作无法恢复。`
            : `「${module.name_zh || module.name_en}」将被永久删除,无法恢复。`
        }
        confirmLabel="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
