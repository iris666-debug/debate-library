import { useState, useEffect } from 'react'
import { isSpeechSupported, speak, stopSpeaking } from '../utils/speech'

export default function SpeakButton({ text, rate, label, className = '' }) {
  const [playing, setPlaying] = useState(false)
  const [voice, setVoice] = useState('female-us')

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
      speak(text, { rate, voice })
      setPlaying(true)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        className={`px-2 py-1 text-xs rounded hover:bg-stone-100 ${className}`}
      >
        {playing ? `⏸ ${label || '停止'}` : `🔊 ${label || '朗读'}`}
      </button>
      <select
        value={voice}
        onChange={(e) => setVoice(e.target.value)}
        className="text-xs border border-stone-300 rounded px-1 py-0.5"
        onClick={(e) => e.stopPropagation()}
      >
        <option value="female-us">Female US</option>
        <option value="male-us">Male US</option>
        <option value="female-gb">Female UK</option>
        <option value="male-gb">Male UK</option>
      </select>
    </div>
  )
}
