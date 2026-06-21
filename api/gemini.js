export default async function handler(req, res) {
  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { prompt } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Missing prompt' })
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY not configured on server' })
  }

  const PRIMARY_MODEL = 'gemini-2.5-flash'
  const FALLBACK_MODEL = 'gemini-2.5-flash-lite'
  const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

  const tryModel = async (model) => {
    const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (response.status === 429) {
      throw new Error('RATE_LIMIT')
    }

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`API error: ${response.status} ${err}`)
    }

    const data = await response.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('Empty response from API')
    }

    return text
  }

  try {
    // 先试主模型
    const result = await tryModel(PRIMARY_MODEL)
    return res.status(200).json({ result, model: PRIMARY_MODEL })
  } catch (err) {
    // 主模型限额，切备用
    if (err.message === 'RATE_LIMIT') {
      try {
        const result = await tryModel(FALLBACK_MODEL)
        return res.status(200).json({ result, model: FALLBACK_MODEL })
      } catch (fallbackErr) {
        return res.status(429).json({ error: '请求太频繁，触发免费额度限制（每天 1500 次/模型）' })
      }
    }
    return res.status(500).json({ error: err.message || 'AI 请求失败' })
  }
}
