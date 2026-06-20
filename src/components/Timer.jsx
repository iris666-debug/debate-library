import { useEffect, useRef, useState } from 'react'

export default function Timer({ seconds = 30, onComplete }) {
  const total = seconds * 10
  const [remaining, setRemaining] = useState(total)
  const fired = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval)
          if (!fired.current) {
            fired.current = true
            onComplete?.()
          }
          return 0
        }
        return r - 1
      })
    }, 100)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const percent = (remaining / total) * 100
  const secondsRemaining = Math.ceil(remaining / 10)

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="text-7xl md:text-8xl font-semibold tabular-nums leading-none">
          {secondsRemaining}
        </div>
        <div className="text-xs text-stone-400 mt-2 tracking-wide">秒</div>
      </div>
      <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-stone-900 transition-[width] duration-100 ease-linear"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
