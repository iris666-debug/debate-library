const PRIMARY_MODEL = 'gemini-2.5-flash'
const FALLBACK_MODEL = 'gemini-2.5-flash-lite'
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const apiKey = import.meta.env.VITE_GEMINI_API_KEY

export const isGeminiConfigured = Boolean(apiKey)

let currentModel = PRIMARY_MODEL
let primaryFailed = false

export async function askGemini(prompt) {
  if (!apiKey) {
    throw new Error(
      '未配置 Gemini API Key。请访问 https://aistudio.google.com/apikey 免费申请，然后在项目根目录的 .env.local 文件里设置 VITE_GEMINI_API_KEY'
    )
  }

  const tryModel = async (model) => {
    const url = `${API_BASE}/${model}:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    })

    if (res.status === 429) {
      throw new Error('请求太频繁，触发免费额度限制（每天 1500 次/模型）')
    }

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`API 请求失败: ${res.status} ${err}`)
    }

    const data = await res.json()
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) {
      throw new Error('AI 返回内容为空，可能触发安全过滤，换个问法试试')
    }

    return text
  }

  try {
    return await tryModel(currentModel)
  } catch (err) {
    if (
      err.message.includes('429') &&
      currentModel === PRIMARY_MODEL &&
      !primaryFailed
    ) {
      primaryFailed = true
      currentModel = FALLBACK_MODEL
      console.warn(
        `主模型 ${PRIMARY_MODEL} 达到限额，切换到备用模型 ${FALLBACK_MODEL}`
      )
      return await tryModel(currentModel)
    }
    throw err
  }
}
