import { useState, useEffect } from 'react'
import { isSpeechSupported, speak, stopSpeaking } from '../utils/speech'

export default function SpeakButton({ text, rate, label, className = '' }) {
  const [playing, setPlaying] = useState(false)

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setPlaying(false)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [playing])

  if (!isSpeechSupported || !text) return null

  const handleClick = (e) => {
    e.stopPropagation()
    e.preventDefault()
    if (playing) {
      stopSpeaking()
      setPlaying(false)
    } else {
      speak(text, { rate })
      setPlaying(true)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`px-2 py-1 text-xs rounded hover:bg-stone-100 ${className}`}
    >
      {playing ? `⏸ ${label || '停止'}` : `🔊 ${label || '朗读'}`}
    </button>
  )
}
