import { useState, useEffect } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { MOTION_TYPES } from '../data/debateTaxonomy'
import {
  getMotionTypeNote,
  saveMotionTypeNote,
  initializeMotionTypeNotes,
} from '../data/motionTypeNotes'

export default function MotionTypeGuidePage() {
  const { user } = useAuth()
  const [notes, setNotes] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        // 初始化6条空文档（如果不存在）
        await initializeMotionTypeNotes(user.uid)
        // 加载所有笔记
        const loaded = {}
        await Promise.all(
          MOTION_TYPES.map(async (t) => {
            const note = await getMotionTypeNote(user.uid, t.value)
            loaded[t.value] = note
          })
        )
        setNotes(loaded)
      } catch (err) {
        console.error('加载失败', err)
      } finally {
        setLoading(false)
      }
    })()
  }, [user])

  const handleSave = async (motionType) => {
    setSaving((prev) => ({ ...prev, [motionType]: true }))
    try {
      await saveMotionTypeNote(user.uid, motionType, notes[motionType])
    } catch (err) {
      alert('保存失败: ' + (err?.message || ''))
    } finally {
      setSaving((prev) => ({ ...prev, [motionType]: false }))
    }
  }

  const updateField = (motionType, field, value) => {
    setNotes((prev) => ({
      ...prev,
      [motionType]: {
        ...prev[motionType],
        [field]: value,
      },
    }))
  }

  if (loading) {
    return <div className="text-sm text-stone-400">加载中…</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Motion Type</h1>
        <p className="text-xs text-stone-500">
          针对每种 Motion 句式积累打法心得，自己编辑、长期沉淀
        </p>
      </div>

      <div className="grid gap-4">
        {MOTION_TYPES.map((t) => {
          const note = notes[t.value] || {}
          const isSaving = saving[t.value]
          return (
            <div
              key={t.value}
              className="bg-white border border-stone-200 rounded-2xl p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {t.value} — {t.label.split('—')[1]?.trim() || t.label}
                </h2>
                <button
                  onClick={() => handleSave(t.value)}
                  disabled={isSaving}
                  className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800 disabled:opacity-50"
                >
                  {isSaving ? '保存中…' : '保存'}
                </button>
              </div>

              <div className="space-y-3">
                <Field label="核心论证要求" placeholder="这类辩题的核心论证要求是什么？">
                  <textarea
                    value={note.coreRequirement || ''}
                    onChange={(e) =>
                      updateField(t.value, 'coreRequirement', e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-y"
                  />
                </Field>

                <Field label="正方重心" placeholder="正方打这类题通常从哪些角度入手？">
                  <textarea
                    value={note.propFocus || ''}
                    onChange={(e) =>
                      updateField(t.value, 'propFocus', e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-y"
                  />
                </Field>

                <Field label="反方重心" placeholder="反方打这类题通常从哪些角度反驳？">
                  <textarea
                    value={note.oppFocus || ''}
                    onChange={(e) =>
                      updateField(t.value, 'oppFocus', e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-y"
                  />
                </Field>

                <Field label="常见误区" placeholder="打这类题容易犯哪些错误？">
                  <textarea
                    value={note.commonMistakes || ''}
                    onChange={(e) =>
                      updateField(t.value, 'commonMistakes', e.target.value)
                    }
                    rows={2}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-y"
                  />
                </Field>

                <Field label="示例题" placeholder="记录几道这类题的代表题目">
                  <textarea
                    value={note.examples || ''}
                    onChange={(e) =>
                      updateField(t.value, 'examples', e.target.value)
                    }
                    rows={3}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm resize-y"
                  />
                </Field>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function Field({ label, placeholder, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-stone-700">{label}</label>
      {children}
    </div>
  )
}
