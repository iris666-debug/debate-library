// 前端不再直接持有 API Key，改为请求后端代理
export const isGeminiConfigured = true // 总是返回 true，因为 key 在服务端

const AI_BUSY_MESSAGE = 'AI服务繁忙，请稍后再试'

export async function askGemini(prompt) {
  let res
  try {
    res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
  } catch (err) {
    throw new Error(AI_BUSY_MESSAGE)
  }

  // 429 (rate limit) and 503 (service unavailable) → friendly message
  if (res.status === 429 || res.status === 503) {
    throw new Error(AI_BUSY_MESSAGE)
  }

  if (!res.ok) {
    // Other errors also show friendly message for AI-related issues
    if (res.status >= 500) {
      throw new Error(AI_BUSY_MESSAGE)
    }
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `请求失败: ${res.status}`)
  }

  const data = await res.json()
  return data.result
}
