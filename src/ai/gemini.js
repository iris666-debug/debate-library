// 前端不再直接持有 API Key，改为请求后端代理
export const isGeminiConfigured = true // 总是返回 true，因为 key 在服务端

export async function askGemini(prompt) {
  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })

  if (res.status === 429) {
    throw new Error('请求太频繁，触发免费额度限制（每天 1500 次/模型）')
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `请求失败: ${res.status}`)
  }

  const data = await res.json()
  return data.result
}
