import { useState } from 'react'
import { useAuth } from './AuthProvider'

export default function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const onSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(email.trim(), password)
    } catch (err) {
      setError(mapError(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-8 space-y-6"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">辩题库</h1>
          <p className="text-sm text-stone-500">登录后开始练习</p>
        </div>

        <div className="space-y-4">
          <label className="block">
            <span className="text-sm text-stone-700">邮箱</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-sm text-stone-700">密码</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-stone-900 focus:outline-none"
            />
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-stone-900 text-white py-2 text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
        >
          {submitting ? '登录中…' : '登录'}
        </button>
      </form>
    </div>
  )
}

function mapError(err) {
  const code = err?.code || ''
  if (code.includes('invalid-credential') || code.includes('wrong-password') || code.includes('user-not-found')) {
    return '邮箱或密码错误'
  }
  if (code.includes('too-many-requests')) return '尝试过多,稍后再试'
  if (code.includes('network')) return '网络错误,检查连接后重试'
  return err?.message || '登录失败'
}
