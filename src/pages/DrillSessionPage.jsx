import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import { getMotion } from '../data/motions'
import Timer from '../components/Timer'
import ArgumentDisplay from '../components/ArgumentDisplay'

const IDLE = 'idle'
const COUNTING = 'counting'
const REVEALED = 'revealed'
const RATED = 'rated'

export default function DrillSessionPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { items: allMotions } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })

  const [motion, setMotion] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState(IDLE)
  const [rating, setRating] = useState(null)
  const [round, setRound] = useState(0)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    setLoading(true)
    setError('')
    setPhase(IDLE)
    setRating(null)
    setRound(0)
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

  const start = () => {
    setPhase(COUNTING)
    setRound((r) => r + 1)
  }
  const skip = () => setPhase(REVEALED)
  const onTimerComplete = () => setPhase(REVEALED)
  const rate = (r) => {
    setRating(r)
    setPhase(RATED)
  }
  const replay = () => {
    setPhase(IDLE)
    setRating(null)
  }
  const pickNext = () => {
    const others = allMotions.filter((m) => m.id !== id)
    if (others.length === 0) {
      replay()
      return
    }
    const next = others[Math.floor(Math.random() * others.length)]
    navigate(`/drill/${next.id}`)
  }

  if (loading) return <div className="text-sm text-stone-400">加载中…</div>
  if (error)
    return (
      <div className="space-y-4">
        <Link to="/drill" className="text-sm text-stone-500 hover:text-stone-900">
          ← 返回选择
        </Link>
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </div>
      </div>
    )
  if (!motion) return null

  const showArgs = phase === REVEALED || phase === RATED

  return (
    <div className="space-y-6 pb-24">
      <Link to="/drill" className="text-sm text-stone-500 hover:text-stone-900">
        ← 返回选择
      </Link>

      <header className="space-y-1.5">
        <h1 className="text-xl md:text-2xl font-semibold leading-snug whitespace-pre-wrap">
          {motion.text}
        </h1>
        {motion.source && <p className="text-sm text-stone-500">{motion.source}</p>}
      </header>

      {phase === IDLE && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center space-y-4">
          <p className="text-sm text-stone-600 leading-relaxed">
            看 Motion 准备好后点开始,30 秒口头复述论点。
            <br />
            倒计时结束自动展开论点对照。
          </p>
          <button
            onClick={start}
            className="px-6 py-3 rounded-lg bg-stone-900 text-white text-sm font-medium hover:bg-stone-800"
          >
            开始 (30 秒)
          </button>
        </div>
      )}

      {phase === COUNTING && (
        <div className="bg-white border border-stone-200 rounded-2xl p-8 space-y-6">
          <Timer key={round} seconds={30} onComplete={onTimerComplete} />
          <div className="flex justify-center">
            <button
              onClick={skip}
              className="text-sm text-stone-500 hover:text-stone-900"
            >
              跳过倒计时 →
            </button>
          </div>
        </div>
      )}

      {showArgs && (
        <>
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
        </>
      )}

      {showArgs && (
        <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur border-t border-stone-200 px-4 py-3 z-10">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-3 flex-wrap">
            {phase === REVEALED ? (
              <>
                <span className="text-xs text-stone-500">这次怎么样?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => rate('fluent')}
                    className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                  >
                    流畅 ✓
                  </button>
                  <button
                    onClick={() => rate('stuck')}
                    className="px-5 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
                  >
                    卡顿
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="text-xs text-stone-500">
                  本次:
                  <span
                    className={
                      rating === 'fluent' ? 'text-emerald-700' : 'text-amber-700'
                    }
                  >
                    {rating === 'fluent' ? '流畅 ✓' : '卡顿'}
                  </span>
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={replay}
                    className="px-4 py-1.5 rounded-lg border border-stone-300 text-sm hover:bg-stone-100"
                  >
                    再来一次
                  </button>
                  <button
                    onClick={pickNext}
                    className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
                  >
                    换一张 🎲
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
