import { useState, useEffect } from 'react'

export const isSpeechSupported = 'speechSynthesis' in window

const VOICE_KEY = 'preferred_voice'

function getVoice(voiceKey) {
  const voices = window.speechSynthesis.getVoices()
  let selectedVoice = null

  if (voiceKey === 'female-us') {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en-US') && v.name.toLowerCase().includes('female')
    ) || voices.find(v => v.lang.startsWith('en-US') && !v.name.toLowerCase().includes('male'))
  } else if (voiceKey === 'male-us') {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en-US') && v.name.toLowerCase().includes('male')
    )
  } else if (voiceKey === 'female-gb') {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en-GB') && v.name.toLowerCase().includes('female')
    ) || voices.find(v => v.lang.startsWith('en-GB') && !v.name.toLowerCase().includes('male'))
  } else if (voiceKey === 'male-gb') {
    selectedVoice = voices.find(v =>
      v.lang.startsWith('en-GB') && v.name.toLowerCase().includes('male')
    )
  }

  if (!selectedVoice) {
    selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0]
  }

  return selectedVoice
}

export function useSpeech() {
  const [playing, setPlaying] = useState(false)
  const [voice, setVoice] = useState(() => {
    return localStorage.getItem(VOICE_KEY) || 'female-us'
  })

  useEffect(() => {
    localStorage.setItem(VOICE_KEY, voice)
  }, [voice])

  useEffect(() => {
    if (!playing) return
    const interval = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        setPlaying(false)
      }
    }, 100)
    return () => clearInterval(interval)
  }, [playing])

  const speak = (text, rate = 1) => {
    if (!isSpeechSupported || !text) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = rate
    const selectedVoice = getVoice(voice)
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    }
    window.speechSynthesis.speak(utterance)
    setPlaying(true)
  }

  const stop = () => {
    if (!isSpeechSupported) return
    window.speechSynthesis.cancel()
    setPlaying(false)
  }

  const toggle = (text, rate = 1) => {
    if (playing) {
      stop()
    } else {
      speak(text, rate)
    }
  }

  return { playing, voice, setVoice, speak, stop, toggle }
}
