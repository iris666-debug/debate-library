import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { getMotion } from '../data/motions'
import PoiDrillStep from '../components/PoiDrillStep'

export default function PoiSessionPage() {
  const { id } = useParams()
  const { user } = useAuth()

  const [motion, setMotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [argRef, setArgRef] = useState(null)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [phase, setPhase] = useState('answering')
  const [userAnswer, setUserAnswer] = useState('')
  const [results, setResults] = useState({ ok: 0, again: 0 })

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError('')
    setArgRef(null)
    setCurrentIdx(0)
    setPhase('answering')
    setUserAnswer('')
    setResults({ ok: 0, again: 0 })
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

  const argChoices = useMemo(() => {
    if (!motion) return []
    const c = []
    ;(motion.propArgs || []).forEach((a, i) =>
      c.push({
        ref: `prop-${i}`,
        label: `正方论点 ${i + 1}`,
        count: (a.pois || []).length,
      })
    )
    ;(motion.oppArgs || []).forEach((a, i) =>
      c.push({
        ref: `opp-${i}`,
        label: `反方论点 ${i + 1}`,
        count: (a.pois || []).length,
      })
    )
    return c
  }, [motion])

  const totalPois = useMemo(
    () => argChoices.reduce((s, c) => s + c.count, 0),
    [argChoices]
  )

  const queue = useMemo(() => {
    if (!motion || !argRef) return []
    if (argRef === 'all') {
      const all = []
      ;(motion.propArgs || []).forEach((a, i) =>
        (a.pois || []).forEach((p) =>
          all.push({ poi: p, argLabel: `正方${i + 1}` })
        )
      )
      ;(motion.oppArgs || []).forEach((a, i) =>
        (a.pois || []).forEach((p) =>
          all.push({ poi: p, argLabel: `反方${i + 1}` })
        )
      )
      return all
    }
    const [side, idxStr] = argRef.split('-')
    const idx = +idxStr
    const args = side === 'prop' ? motion.propArgs : motion.oppArgs
    const arg = args?.[idx]
    const label = side === 'prop' ? `正方${idx + 1}` : `反方${idx + 1}`
    return (arg?.pois || []).map((p) => ({ poi: p, argLabel: label }))
  }, [motion, argRef])

  const startArg = (ref) => {
    setArgRef(ref)
    setCurrentIdx(0)
    setPhase('answering')
    setUserAnswer('')
    setResults({ ok: 0, again: 0 })
  }
  const showAnswer = () => setPhase('comparing')
  const next = (ok) => {
    setResults((r) =>
      ok ? { ...r, ok: r.ok + 1 } : { ...r, again: r.again + 1 }
    )
    if (currentIdx + 1 >= queue.length) {
      setPhase('done')
    } else {
      setCurrentIdx((i) => i + 1)
      setPhase('answering')
      setUserAnswer('')
    }
  }
  const replay = () => {
    setCurrentIdx(0)
    setPhase('answering')
    setUserAnswer('')
    setResults({ ok: 0, again: 0 })
  }
  const backToPicker = () => setArgRef(null)

  if (loading) return <div className="text-sm text-stone-400">加载中…</div>
  if (error)
    return (
      <div className="space-y-4">
        <Link to="/poi" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回选择
        </Link>
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      </div>
    )
  if (!motion) return null

  const current = queue[currentIdx]

  return (
    <div className="space-y-6 pb-24">
      <Link to="/poi" className="text-sm text-stone-500 hover:text-stone-900">
        ← 返回选择
      </Link>

      <header className="space-y-1.5">
        <h1 className="text-xl md:text-2xl font-semibold leading-snug whitespace-pre-wrap">
          {motion.text}
        </h1>
        {motion.source && (
          <p className="text-sm text-stone-500">{motion.source}</p>
        )}
      </header>

      {argRef === null && (
        <ArgumentPicker
          totalPois={totalPois}
          argChoices={argChoices}
          onStart={startArg}
          motionId={id}
        />
      )}

      {argRef !== null && phase !== 'done' && current && (
        <PoiDrillStep
          current={current}
          currentIdx={currentIdx}
          total={queue.length}
          phase={phase}
          userAnswer={userAnswer}
          onUserAnswerChange={setUserAnswer}
          onShowAnswer={showAnswer}
          onNext={next}
          onBack={backToPicker}
        />
      )}

      {argRef !== null && phase === 'done' && (
        <DoneScreen
          total={queue.length}
          ok={results.ok}
          again={results.again}
          onReplay={replay}
          onBack={backToPicker}
        />
      )}
    </div>
  )
}

function ArgumentPicker({ totalPois, argChoices, onStart, motionId }) {
  if (totalPois === 0) {
    return (
      <div className="bg-white border border-dashed border-stone-300 rounded-2xl p-8 text-center space-y-2">
        <p className="text-sm text-stone-500">这张题卡还没录入 POI。</p>
        <Link
          to={`/motions/${motionId}/edit`}
          className="text-xs text-stone-600 hover:text-stone-900 underline"
        >
          前往编辑题卡
        </Link>
      </div>
    )
  }
  return (
    <div className="space-y-3">
      <h2 className="text-sm font-medium text-stone-700">选一组论点开始</h2>
      <button
        onClick={() => onStart('all')}
        className="w-full bg-stone-900 text-white px-4 py-3 rounded-lg text-sm hover:bg-stone-800"
      >
        全部论点 (共 {totalPois} 题)
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {argChoices.map((c) => (
          <button
            key={c.ref}
            onClick={() => onStart(c.ref)}
            disabled={c.count === 0}
            className={
              'text-left p-3 rounded-lg border transition ' +
              (c.count === 0
                ? 'border-stone-200 bg-stone-50 text-stone-400 cursor-not-allowed'
                : 'border-stone-200 bg-white hover:border-stone-400')
            }
          >
            <div className="text-sm font-medium">{c.label}</div>
            <div className="text-xs text-stone-500 mt-0.5">
              {c.count === 0 ? '无 POI' : `${c.count} 题`}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function DoneScreen({ total, ok, again, onReplay, onBack }) {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-4 text-center">
      <h2 className="text-2xl font-semibold">完成!</h2>
      <p className="text-sm text-stone-600">
        本轮 {total} 题:满意{' '}
        <span className="text-emerald-700 font-semibold">{ok}</span> · 再练{' '}
        <span className="text-amber-700 font-semibold">{again}</span>
      </p>
      <div className="flex gap-2 justify-center pt-2 flex-wrap">
        <button
          onClick={onReplay}
          className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
        >
          再来一遍
        </button>
        <button
          onClick={onBack}
          className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
        >
          换一组论点
        </button>
        <Link
          to="/poi"
          className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
        >
          换一张题卡
        </Link>
      </div>
    </div>
  )
}
