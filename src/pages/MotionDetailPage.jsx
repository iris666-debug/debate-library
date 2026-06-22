import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import { getMotion } from '../data/motions'
import ArgumentDisplay from '../components/ArgumentDisplay'
import SpeakButton from '../components/SpeakButton'

export default function MotionDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const { items: modules } = useUserCollection('modules', {
    orderBy: 'createdAt',
    orderDir: 'asc',
  })

  const [motion, setMotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError('')
    getMotion(user.uid, id)
      .then((data) => {
        if (cancelled) return
        if (!data) setError('题卡不存在或已被删除')
        else setMotion(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || '加载失败')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [id, user?.uid])

  const moduleMap = useMemo(() => {
    const m = {}
    modules.forEach((x) => {
      m[x.id] = x
    })
    return m
  }, [modules])

  if (loading) return <div className="text-sm text-stone-400">加载中…</div>

  if (error)
    return (
      <div className="space-y-4">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回
        </Link>
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      </div>
    )

  if (!motion) return null

  const linkedModules = (motion.linkedModuleIds || [])
    .map((mid) => moduleMap[mid])
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回
        </Link>
        <div className="flex gap-2">
          <Link
            to={`/drill/${id}`}
            className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
          >
            开始复述
          </Link>
          <Link
            to={`/motions/${id}/edit`}
            className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
          >
            编辑
          </Link>
        </div>
      </div>

      <header className="space-y-3">
        <div className="flex items-start gap-3">
          <h1 className="flex-1 text-xl md:text-2xl font-semibold leading-snug whitespace-pre-wrap">
            {motion.text}
          </h1>
          <SpeakButton text={motion.text} className="mt-1 shrink-0" />
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          {motion.source && <span className="text-stone-500">{motion.source}</span>}
          {/* 兼容旧数据单字符串 + 新数据数组 */}
          {(motion.coreClashes || (motion.coreClash ? [motion.coreClash] : [])).map((c) => (
            <span key={c} className="bg-stone-900 text-white rounded-md px-2 py-0.5 text-xs">
              ⚔️ {c}
            </span>
          ))}
          {motion.motionType && (
            <span className="bg-stone-700 text-white rounded-md px-2 py-0.5 text-xs">
              {motion.motionType}
            </span>
          )}
          {motion.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {motion.tags.map((t) => (
                <span
                  key={t}
                  className="bg-stone-100 text-stone-700 rounded-md px-2 py-0.5 text-xs"
                >
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {linkedModules.length > 0 && (
        <section className="bg-white border border-stone-200 rounded-2xl p-4">
          <h2 className="text-sm font-medium text-stone-700 mb-2">关联万能模块</h2>
          <div className="flex flex-wrap gap-2">
            {linkedModules.map((m) => (
              <Link
                key={m.id}
                to={`/modules/${m.id}`}
                className="bg-amber-50 text-amber-800 rounded-md px-2.5 py-1 text-xs hover:bg-amber-100"
                title={m.definition_zh || m.definition_en || ''}
              >
                {m.name_zh || m.name_en || '(未命名)'}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-semibold">正方论点 (Proposition)</h2>
        <div className="space-y-2">
          {(motion.propArgs || []).map((a, i) => (
            <ArgumentDisplay key={i} index={i} side="prop" value={a} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">反方论点 (Opposition)</h2>
        <div className="space-y-2">
          {(motion.oppArgs || []).map((a, i) => (
            <ArgumentDisplay key={i} index={i} side="opp" value={a} />
          ))}
        </div>
      </section>
    </div>
  )
}
