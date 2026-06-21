export const isSpeechSupported = 'speechSynthesis' in window

let cachedVoice = null

function getEnglishVoice() {
  if (cachedVoice) return cachedVoice
  const voices = window.speechSynthesis.getVoices()
  cachedVoice = voices.find((v) => v.lang.startsWith('en')) || voices[0]
  return cachedVoice
}

if (isSpeechSupported) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoice = null
  }
}

export function speak(text, { rate = 1 } = {}) {
  if (!isSpeechSupported || !text) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'en-US'
  utterance.rate = rate
  const voice = getEnglishVoice()
  if (voice) utterance.voice = voice
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (!isSpeechSupported) return
  window.speechSynthesis.cancel()
}
