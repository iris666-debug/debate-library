import { useState, useMemo } from 'react'
import { useUserCollection } from '../hooks/useCollection'
import { isGeminiConfigured, askGemini } from '../ai/gemini'
import {
  buildPoiPrompt,
  buildWeaknessPrompt,
  buildSimilarPrompt,
  buildPdfExtractPrompt,
  buildMicrostoryPrompt,
  buildCompressionPrompt,
} from '../ai/prompts'
import { extractPdfText, MAX_PDF_CHARS } from '../ai/pdfText'

const MODES = [
  // Prepare
  { id: 'weakness', label: 'Argument Weakness Check', category: 'prepare' },
  { id: 'similar', label: 'Similar Motions', category: 'prepare' },
  { id: 'extension', label: 'Extension Generator', category: 'prepare' },
  { id: 'pdf', label: 'PDF Extraction', category: 'prepare' },
  // Train
  { id: 'poi', label: 'POI Simulation', category: 'train' },
  { id: 'microstory', label: 'Micro-story Generator', category: 'train' },
  { id: 'compression', label: 'Compression Suggester', category: 'train' },
]

export default function CoachPage() {
  const { items: motions } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })

  const [mode, setMode] = useState('weakness')
  const [selectedMotionId, setSelectedMotionId] = useState('')
  const [side, setSide] = useState('prop')
  const [pdfFile, setPdfFile] = useState(null)
  const [pdfInfo, setPdfInfo] = useState(null)
  const [mechanismInput, setMechanismInput] = useState('')
  const [textInput, setTextInput] = useState('')
  const [openingArguments, setOpeningArguments] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState('')
  const [error, setError] = useState('')

  const selectedMotion = useMemo(
    () => motions.find((m) => m.id === selectedMotionId),
    [motions, selectedMotionId]
  )

  const handlePdfSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPdfFile(file)
    setPdfInfo(null)
    setError('')
    try {
      setLoading(true)
      const info = await extractPdfText(file)
      setPdfInfo(info)
      if (info.isEmpty) {
        setError('PDF 可能是扫描图片版，暂不支持文字提取')
      }
    } catch (err) {
      setError(err?.message || 'PDF 解析失败')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async () => {
    setError('')
    setResult('')

    try {
      if (mode === 'pdf') {
        if (!pdfInfo || pdfInfo.isEmpty) {
          setError('请选择有效的 PDF 文件')
          return
        }
      } else {
        if (!selectedMotion) {
          setError('请选择一道辩题')
          return
        }
      }

      setLoading(true)
      let prompt = ''

      if (mode === 'poi') {
        prompt = buildPoiPrompt(selectedMotion, side)
      } else if (mode === 'weakness') {
        prompt = buildWeaknessPrompt(selectedMotion)
      } else if (mode === 'similar') {
        prompt = buildSimilarPrompt(selectedMotion, motions)
      } else if (mode === 'pdf') {
        const motionText = selectedMotion?.text || ''
        const motionTags = selectedMotion?.tags || []
        prompt = buildPdfExtractPrompt(motionText, pdfInfo.text, motionTags)
      }

      const answer = await askGemini(prompt)
      setResult(answer)
    } catch (err) {
      setError(err?.message || '生成失败')
    } finally {
      setLoading(false)
    }
  }

  if (!isGeminiConfigured) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold">AI 教练</h1>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-amber-900">需要配置 Gemini API Key</h2>
          <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
            <li>
              访问{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                https://aistudio.google.com/apikey
              </a>{' '}
              免费申请 API Key
            </li>
            <li>
              在项目根目录创建 <code className="bg-amber-100 px-1">.env.local</code>{' '}
              文件（如果没有）
            </li>
            <li>
              写入 <code className="bg-amber-100 px-1">VITE_GEMINI_API_KEY=你的key</code>
            </li>
            <li>
              重启开发服务器 <code className="bg-amber-100 px-1">npm run dev</code>
            </li>
          </ol>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">AI Coach</h1>

      {/* Prepare Section */}
      <div>
        <h2 className="text-sm font-semibold text-stone-600 mb-2">Prepare</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MODES.filter(m => m.category === 'prepare').map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id)
                setResult('')
                setError('')
              }}
              className={
                'px-4 py-2 rounded-lg text-sm transition ' +
                (mode === m.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-300 hover:bg-stone-100')
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Train Section */}
      <div>
        <h2 className="text-sm font-semibold text-stone-600 mb-2">Train</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {MODES.filter(m => m.category === 'train').map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMode(m.id)
                setResult('')
                setError('')
              }}
              className={
                'px-4 py-2 rounded-lg text-sm transition ' +
                (mode === m.id
                  ? 'bg-stone-900 text-white'
                  : 'bg-white border border-stone-300 hover:bg-stone-100')
              }
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
        {mode === 'microstory' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              Enter Mechanism Chain
            </label>
            <textarea
              value={mechanismInput}
              onChange={(e) => setMechanismInput(e.target.value)}
              placeholder="Enter your mechanism chain, e.g. AI automation → job loss → inequality"
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
            <p className="text-xs text-stone-500">
              AI will generate a 100-word character scenario for Impact stage
            </p>
          </div>
        ) : mode === 'compression' ? (
          <div className="space-y-2">
            <label className="text-sm font-medium text-stone-700">
              Enter Verbose Expression
            </label>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter your verbose expression in Chinese or English"
              rows={4}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
            />
            <p className="text-xs text-stone-500">
              AI will provide 3 compressed phrases with logic explanations
            </p>
          </div>
        ) : mode === 'extension' ? (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Select Motion</span>
              <select
                value={selectedMotionId}
                onChange={(e) => setSelectedMotionId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              >
                <option value="">Select a motion...</option>
                {motions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.text}
                  </option>
                ))}
              </select>
            </label>
            <div>
              <span className="text-sm font-medium text-stone-700 block mb-2">Your Side</span>
              <div className="inline-flex rounded-lg border border-stone-300 overflow-hidden">
                <button
                  onClick={() => setSide('prop')}
                  className={
                    'px-4 py-1.5 text-sm transition ' +
                    (side === 'prop'
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-50')
                  }
                >
                  Prop
                </button>
                <button
                  onClick={() => setSide('opp')}
                  className={
                    'px-4 py-1.5 text-sm transition ' +
                    (side === 'opp'
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 hover:bg-stone-50')
                  }
                >
                  Opp
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-stone-700">
                What did Opening already argue?
              </label>
              <textarea
                value={openingArguments}
                onChange={(e) => setOpeningArguments(e.target.value)}
                placeholder="Summarize Opening's main arguments..."
                rows={4}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              />
              <p className="text-xs text-stone-500">
                AI will generate 3 Extension directions for Closing Bench
              </p>
            </div>
          </>
        ) : mode !== 'pdf' ? (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Select Motion</span>
              <select
                value={selectedMotionId}
                onChange={(e) => setSelectedMotionId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              >
                <option value="">Select a motion...</option>
                {motions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.text}
                  </option>
                ))}
              </select>
            </label>
            {mode === 'poi' && (
              <div>
                <span className="text-sm font-medium text-stone-700 block mb-2">Your Side</span>
                <div className="inline-flex rounded-lg border border-stone-300 overflow-hidden">
                  <button
                    onClick={() => setSide('prop')}
                    className={
                      'px-4 py-1.5 text-sm transition ' +
                      (side === 'prop'
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-50')
                    }
                  >
                    Prop
                  </button>
                  <button
                    onClick={() => setSide('opp')}
                    className={
                      'px-4 py-1.5 text-sm transition ' +
                      (side === 'opp'
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-50')
                    }
                  >
                    Opp
                  </button>
                </div>
              </div>
            )}
            {mode === 'similar' && selectedMotion && !selectedMotion.coreClash && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                This motion has no Core Clash tagged. Results may be less accurate.{' '}
                <a
                  href={`/motions/${selectedMotionId}/edit`}
                  className="underline"
                >
                  Add Core Clash
                </a>
              </div>
            )}
          </>
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Link to Motion (Optional)</span>
              <select
                value={selectedMotionId}
                onChange={(e) => setSelectedMotionId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
              >
                <option value="">-- None --</option>
                {motions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.text}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Upload PDF</span>
              <input
                type="file"
                accept="application/pdf"
                onChange={handlePdfSelect}
                lang="en"
                className="w-full text-sm"
              />
            </label>
            {loading && !result && (
              <p className="text-sm text-stone-500">正在读取 PDF 文字…</p>
            )}
            {pdfInfo && (
              <div className="text-sm text-stone-600 space-y-1">
                <p>
                  文件: {pdfFile?.name} ({pdfInfo.pageCount} 页)
                </p>
                {pdfInfo.truncated && (
                  <p className="text-amber-700">
                    内容较长，只取前 {Math.floor(MAX_PDF_CHARS / 1000)}k 字
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full px-5 py-2 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <pre className="whitespace-pre-wrap text-sm leading-relaxed">{result}</pre>
        </div>
      )}
    </div>
  )
}
