import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import {
  getMotion,
  createMotion,
  updateMotion,
  deleteMotion,
  makeEmptyMotion,
} from '../data/motions'
import TagInput from '../components/TagInput'
import ArgumentEditor from '../components/ArgumentEditor'
import ModuleMultiSelect from '../components/ModuleMultiSelect'
import ConfirmDialog from '../components/ConfirmDialog'

export default function MotionEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const { items: modules } = useUserCollection('modules', {
    orderBy: 'createdAt',
    orderDir: 'asc',
  })

  const [motion, setMotion] = useState(makeEmptyMotion())
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (!isEdit || !user) return
    let cancelled = false
    ;(async () => {
      try {
        const data = await getMotion(user.uid, id)
        if (cancelled) return
        if (!data) {
          setError('题卡不存在或已被删除')
        } else {
          const empty = makeEmptyMotion()
          setMotion({
            ...empty,
            ...data,
            propArgs: padArgs(data.propArgs),
            oppArgs: padArgs(data.oppArgs),
            tags: data.tags || [],
            linkedModuleIds: data.linkedModuleIds || [],
          })
        }
      } catch (err) {
        setError(err?.message || '加载失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isEdit, id, user?.uid])

  const setField = (k, v) => setMotion((m) => ({ ...m, [k]: v }))

  const setArg = (side, idx) => (newArg) =>
    setMotion((m) => {
      const key = side === 'prop' ? 'propArgs' : 'oppArgs'
      const next = [...m[key]]
      next[idx] = newArg
      return { ...m, [key]: next }
    })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!motion.text.trim()) {
      setError('请填写 Motion 文本')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        text: motion.text.trim(),
        source: motion.source.trim(),
        tags: motion.tags,
        propArgs: motion.propArgs,
        oppArgs: motion.oppArgs,
        linkedModuleIds: motion.linkedModuleIds,
      }
      let savedId = id
      if (isEdit) {
        await updateMotion(user.uid, id, payload)
      } else {
        const ref = await createMotion(user.uid, payload)
        savedId = ref.id
      }
      navigate(`/motions/${savedId}`)
    } catch (err) {
      setError(err?.message || '保存失败')
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    await deleteMotion(user.uid, id)
    navigate('/')
  }

  if (loading) {
    return <div className="text-sm text-stone-400">加载中…</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      <div className="flex items-center gap-3">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {isEdit ? '编辑题卡' : '新增题卡'}
        </h1>
      </div>

      <Section title="基本信息">
        <Field label="Motion 原文" required>
          <textarea
            value={motion.text}
            onChange={(e) => setField('text', e.target.value)}
            rows={2}
            placeholder="例如:This House would ban..."
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none resize-y"
          />
        </Field>
        <Field label="赛事来源">
          <input
            type="text"
            value={motion.source}
            onChange={(e) => setField('source', e.target.value)}
            placeholder="例如:WUDC 2024 R3"
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
          />
        </Field>
        <Field label="标签">
          <TagInput
            value={motion.tags}
            onChange={(v) => setField('tags', v)}
          />
        </Field>
      </Section>

      <Section title="正方论点 (Proposition)">
        {motion.propArgs.map((a, i) => (
          <ArgumentEditor
            key={i}
            index={i}
            side="prop"
            value={a}
            onChange={setArg('prop', i)}
          />
        ))}
      </Section>

      <Section title="反方论点 (Opposition)">
        {motion.oppArgs.map((a, i) => (
          <ArgumentEditor
            key={i}
            index={i}
            side="opp"
            value={a}
            onChange={setArg('opp', i)}
          />
        ))}
      </Section>

      <Section title="关联万能模块">
        <ModuleMultiSelect
          modules={modules}
          value={motion.linkedModuleIds}
          onChange={(v) => setField('linkedModuleIds', v)}
        />
      </Section>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      )}

      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-stone-200 px-4 py-3 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          {isEdit ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-600 hover:text-red-700"
            >
              删除题卡
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Link
              to="/"
              className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
            >
              取消
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50"
            >
              {submitting ? '保存中…' : '保存'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="删除题卡?"
        message={`「${motion.text || '未命名题卡'}」将被永久删除,无法恢复。`}
        confirmLabel="删除"
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </form>
  )
}

function padArgs(arr) {
  const empty = {
    name_en: '', name_zh: '',
    claim_en: '', claim_zh: '',
    mechanism_en: '', mechanism_zh: '',
    comparative_en: '', comparative_zh: '',
    impact_en: '', impact_zh: '',
    pois: [],
  }
  const a = Array.isArray(arr) ? arr.slice(0, 3) : []
  while (a.length < 3) a.push({ ...empty })
  return a.map((x) => ({ ...empty, ...x, pois: x.pois || [] }))
}

function Section({ title, children }) {
  return (
    <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
      <h2 className="font-semibold">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function Field({ label, required, children }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-stone-700 font-medium">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}
