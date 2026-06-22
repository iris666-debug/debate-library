import { useEffect, useState, useMemo } from 'react'
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
import { MOTION_TYPES, SUGGESTED_TAGS } from '../data/debateTaxonomy'
import { askGemini } from '../ai/gemini'
import { buildGenerateSideArgumentsPrompt } from '../ai/prompts'
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

  const { items: allMotions } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })

  const allCoreClashes = useMemo(() => {
    const set = new Set()
    allMotions.forEach((m) => {
      // 兼容旧数据单字符串
      if (m.coreClash) set.add(m.coreClash)
      // 新数据数组
      if (m.coreClashes && Array.isArray(m.coreClashes)) {
        m.coreClashes.forEach((c) => set.add(c))
      }
    })
    return Array.from(set).sort()
  }, [allMotions])

  const [motion, setMotion] = useState(makeEmptyMotion())
  const [loading, setLoading] = useState(isEdit)
  const [submitting, setSubmitting] = useState(false)
  const [generatingSide, setGeneratingSide] = useState({ prop: false, opp: false })
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
          // 向后兼容：旧数据 coreClash 单字符串转为数组
          let coreClashes = data.coreClashes || []
          if (data.coreClash && !data.coreClashes) {
            coreClashes = [data.coreClash]
          }
          setMotion({
            ...empty,
            ...data,
            propArgs: padArgs(data.propArgs),
            oppArgs: padArgs(data.oppArgs),
            tags: data.tags || [],
            motionType: data.motionType || '',
            coreClashes,
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
        motionType: motion.motionType,
        coreClashes: motion.coreClashes,
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

  const handleGenerateSideArguments = async (side) => {
    if (!motion.text.trim()) {
      setError('请先填写辩题文本')
      return
    }

    setGeneratingSide((prev) => ({ ...prev, [side]: true }))
    setError('')

    try {
      const prompt = buildGenerateSideArgumentsPrompt(motion.text, motion.motionType, side)
      const result = await askGemini(prompt)

      // 解析 JSON
      let jsonStr = result.trim()
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/```\s*$/, '')
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/```\s*$/, '')
      }

      const data = JSON.parse(jsonStr)

      // 填入对应侧论点（保留 name_en/zh 和 pois 字段，补充空的 mechanism_points）
      const enrichedArgs = data.map((arg) => ({
        name_en: '',
        name_zh: '',
        ...arg,
        mechanism_points: [],
        pois: [],
      }))

      if (side === 'prop') {
        setMotion((prev) => ({ ...prev, propArgs: enrichedArgs }))
      } else {
        setMotion((prev) => ({ ...prev, oppArgs: enrichedArgs }))
      }
    } catch (err) {
      console.error('AI 生成失败', err)
      setError(err?.message || 'AI 生成失败，请重试')
    } finally {
      setGeneratingSide((prev) => ({ ...prev, [side]: false }))
    }
  }

  const getMotionTypeHint = () => {
    if (!motion.motionType) return null

    if (motion.motionType.includes('THR')) {
      return '⚠️ THR题型提示：你的论点有没有把"遗憾的对象"具象化？遗憾的是一种现象、文化还是具体政策？论点方向会因此完全不同。'
    }

    if (motion.motionType.includes('THO')) {
      return '⚠️ THO题型提示：你找到质的区别了吗？THO不是反对结果，而是反对达成结果的方式或价值取向，注意区分程度差异和性质差异。'
    }

    if (motion.motionType.includes('Compared to') || motion.motionType === 'THBT') {
      return '💡 比较题型提示：Comparative栏位是核心，确保你的比较基准清晰，避免"everything else equal"成为空话。'
    }

    return null
  }

  const motionTypeHint = getMotionTypeHint()

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
        <Field label="Motion Type（辩题立场类型）">
          <select
            value={motion.motionType}
            onChange={(e) => setField('motionType', e.target.value)}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
          >
            <option value="">-- 不指定 --</option>
            {MOTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-stone-500 mt-1">
            想了解各类型的打法心得？
            <Link to="/motion-type-notes" className="text-stone-700 hover:text-stone-900 underline ml-1">
              去打法笔记页面
            </Link>
          </p>
        </Field>
        <Field label="标签">
          <TagInput
            value={motion.tags}
            onChange={(v) => setField('tags', v)}
            suggestions={SUGGESTED_TAGS}
          />
          <p className="text-xs text-stone-500 mt-1">
            可以直接打字搜索预置主题（如 Privacy、Climate Change），也可以输入任意自定义标签。
          </p>
        </Field>
        <Field label="Core Clash（核心矛盾）">
          <TagInput
            value={motion.coreClashes}
            onChange={(v) => setField('coreClashes', v)}
            suggestions={allCoreClashes}
            placeholder="输入核心矛盾标签，如 Innovation vs Safety"
          />
          <p className="text-xs text-stone-500 mt-1">
            Core Clash 描述的是题目的底层矛盾结构（如 Innovation vs Safety），与"标签"（主题分类）和"模块"（论证逻辑）不同。相同 Core Clash 的题目可以做思路迁移训练。一张题卡可以有多个核心矛盾。
          </p>
        </Field>
      </Section>

      {/* 题型感知提示 */}
      {motionTypeHint && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-900">
          {motionTypeHint}
        </div>
      )}

      <Section title="正方论点 (Proposition)">
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleGenerateSideArguments('prop')}
            disabled={!motion.text.trim() || generatingSide.prop}
            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!motion.text.trim() ? '请先填写辩题' : ''}
          >
            {generatingSide.prop ? '生成中…' : 'AI 生成草稿'}
          </button>
          {generatingSide.prop && (
            <span className="text-xs text-stone-500">正在生成正方论点...</span>
          )}
        </div>
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
        <div className="flex items-center gap-3 mb-4">
          <button
            type="button"
            onClick={() => handleGenerateSideArguments('opp')}
            disabled={!motion.text.trim() || generatingSide.opp}
            className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!motion.text.trim() ? '请先填写辩题' : ''}
          >
            {generatingSide.opp ? '生成中…' : 'AI 生成草稿'}
          </button>
          {generatingSide.opp && (
            <span className="text-xs text-stone-500">正在生成反方论点...</span>
          )}
        </div>
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
