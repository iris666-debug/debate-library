export const isSpeechSupported = 'speechSynthesis' in window

let cachedVoices = {}

function getVoice(voiceKey) {
  if (cachedVoices[voiceKey]) return cachedVoices[voiceKey]

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

  // 兜底：任何英文语音
  if (!selectedVoice) {
    selectedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0]
  }

  cachedVoices[voiceKey] = selectedVoice
  return selectedVoice
}

if (isSpeechSupported) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = {}
  }
}

export function speak(text, { rate = 1, voice = 'female-us' } = {}) {
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
}

export function stopSpeaking() {
  if (!isSpeechSupported) return
  window.speechSynthesis.cancel()
}
