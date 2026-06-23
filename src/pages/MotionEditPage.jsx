import { useEffect, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { doc, getDoc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'
import { MOTION_TYPES, SUGGESTED_TAGS } from '../data/debateTaxonomy'
import { useUserCollection } from '../hooks/useCollection'
import TagInput from '../components/TagInput'
import SpeakButton from '../components/SpeakButton'
import ArgumentEditor from '../components/ArgumentEditor'
import { askGemini } from '../ai/gemini'
import { buildTranscriptExtractPrompt } from '../ai/prompts'

export default function MotionEditPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEdit = Boolean(id)

  const { items: motions } = useUserCollection('motions', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })

  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [basicInfoOpen, setBasicInfoOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  const [expandedArgs, setExpandedArgs] = useState({ prop: {}, opp: {} })
  const [transcriptModal, setTranscriptModal] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [previewResult, setPreviewResult] = useState(null)
  const [motion, setMotion] = useState({
    text: '',
    source: '',
    tags: [],
    motionType: '',
    coreClashes: [],
    characterization: '',
    propArgs: [],
    oppArgs: [],
    linkedModuleIds: [],
    postRoundReview: {
      adjudicatorFeedback: '',
      nextImprovement: '',
    },
  })

  useEffect(() => {
    if (!isEdit || !user?.uid || !id) {
      setLoading(false)
      return
    }

    const loadMotion = async () => {
      try {
        const docRef = doc(db, 'users', user.uid, 'motions', id)
        const docSnap = await getDoc(docRef)

        if (!docSnap.exists()) {
          setError('Motion not found')
          setLoading(false)
          return
        }

        const data = docSnap.data()
        setMotion({
          text: data.text || '',
          source: data.source || '',
          tags: data.tags || [],
          motionType: data.motionType || '',
          coreClashes: data.coreClashes || [],
          characterization: data.characterization || '',
          propArgs: data.propArgs || [],
          oppArgs: data.oppArgs || [],
          linkedModuleIds: data.linkedModuleIds || [],
          postRoundReview: data.postRoundReview || {
            adjudicatorFeedback: '',
            nextImprovement: '',
          },
        })
        setLoading(false)
      } catch (err) {
        console.error('Error loading motion:', err)
        setError('Failed to load motion: ' + (err?.message || 'Unknown error'))
        setLoading(false)
      }
    }

    loadMotion()
  }, [id, user?.uid, isEdit])

  const handleSave = async (e) => {
    e.preventDefault()
    if (!user?.uid) return

    try {
      const docRef = id
        ? doc(db, 'users', user.uid, 'motions', id)
        : doc(db, 'users', user.uid, 'motions', Date.now().toString())

      await setDoc(docRef, {
        ...motion,
        updatedAt: serverTimestamp(),
        ...(id ? {} : { createdAt: serverTimestamp() }),
      })

      navigate('/')
    } catch (err) {
      alert('Save failed: ' + (err?.message || ''))
    }
  }

  const handleDelete = async () => {
    if (!user?.uid || !id) return
    if (!confirm('Delete this motion?')) return

    try {
      await deleteDoc(doc(db, 'users', user.uid, 'motions', id))
      navigate('/')
    } catch (err) {
      alert('Delete failed: ' + (err?.message || ''))
    }
  }

  const handleDuplicate = async () => {
    if (!user?.uid) return

    try {
      const newDocRef = doc(db, 'users', user.uid, 'motions', Date.now().toString())
      await setDoc(newDocRef, {
        ...motion,
        text: motion.text + ' (Copy)',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      navigate(`/motions/${newDocRef.id}`)
    } catch (err) {
      alert('Duplicate failed: ' + (err?.message || ''))
    }
  }

  const ensureArgs = (side) => {
    const args = motion[side === 'prop' ? 'propArgs' : 'oppArgs'] || []
    if (args.length === 0) {
      setMotion({
        ...motion,
        [side === 'prop' ? 'propArgs' : 'oppArgs']: [
          { name_en: '', name_zh: '', claim_en: '', claim_zh: '', mechanism_points: [], comparative_en: '', comparative_zh: '', impact_en: '', impact_zh: '', pois: [] },
          { name_en: '', name_zh: '', claim_en: '', claim_zh: '', mechanism_points: [], comparative_en: '', comparative_zh: '', impact_en: '', impact_zh: '', pois: [] },
          { name_en: '', name_zh: '', claim_en: '', claim_zh: '', mechanism_points: [], comparative_en: '', comparative_zh: '', impact_en: '', impact_zh: '', pois: [] },
        ]
      })
    }
  }

  const updateArg = (side, index, newArg) => {
    const key = side === 'prop' ? 'propArgs' : 'oppArgs'
    const args = [...(motion[key] || [])]
    args[index] = newArg
    setMotion({ ...motion, [key]: args })
  }

  const toggleArgExpanded = (side, index) => {
    setExpandedArgs(prev => ({
      ...prev,
      [side]: {
        ...prev[side],
        [index]: !prev[side][index]
      }
    }))
  }

  const expandAll = (side) => {
    const args = motion[side === 'prop' ? 'propArgs' : 'oppArgs'] || []
    const newExpanded = {}
    args.forEach((_, i) => { newExpanded[i] = true })
    setExpandedArgs(prev => ({ ...prev, [side]: newExpanded }))
  }

  const collapseAll = (side) => {
    setExpandedArgs(prev => ({ ...prev, [side]: {} }))
  }

  const handleGenerateFromTranscript = async () => {
    if (!transcript.trim() || !motion.text.trim()) {
      alert('Please enter both motion text and transcript')
      return
    }

    setGenerating(true)
    try {
      const prompt = buildTranscriptExtractPrompt(motion.text, transcript)
      const result = await askGemini(prompt)

      // Parse JSON result
      const parsed = JSON.parse(result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim())
      setPreviewResult(parsed)
    } catch (err) {
      console.error('Generate error:', err)
      alert('Generate failed: ' + (err?.message || 'Unknown error'))
    } finally {
      setGenerating(false)
    }
  }

  const handleConfirmTranscript = () => {
    if (!previewResult) return

    // Merge with existing args (don't overwrite)
    const newPropArgs = [...(motion.propArgs || [])]
    const newOppArgs = [...(motion.oppArgs || [])]

    previewResult.propArgs?.forEach((arg, i) => {
      if (!newPropArgs[i] || !newPropArgs[i].name_en) {
        newPropArgs[i] = arg
      }
    })

    previewResult.oppArgs?.forEach((arg, i) => {
      if (!newOppArgs[i] || !newOppArgs[i].name_en) {
        newOppArgs[i] = arg
      }
    })

    setMotion({
      ...motion,
      propArgs: newPropArgs,
      oppArgs: newOppArgs
    })

    // Close modal
    setTranscriptModal(false)
    setTranscript('')
    setPreviewResult(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stone-900 mx-auto mb-4"></div>
          <p className="text-stone-600">Loading motion...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <Link to="/" className="text-stone-600 hover:text-stone-900 underline">
            ← Back to list
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-4xl mx-auto pb-24">
      <div className="flex items-center justify-between">
        <Link to="/" className="text-sm text-stone-500 hover:text-stone-900">
          ← Back
        </Link>
        <div className="flex gap-3">
          {isEdit && (
            <>
              <button
                type="button"
                onClick={handleDuplicate}
                className="px-4 py-2 text-sm border border-stone-300 rounded-lg hover:bg-stone-50"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
              >
                Delete
              </button>
            </>
          )}
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-stone-900 text-white rounded-lg hover:bg-stone-800"
          >
            Save
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Motion Text
          </label>
          <div className="flex gap-2">
            <textarea
              value={motion.text}
              onChange={(e) => setMotion({ ...motion, text: e.target.value })}
              rows={3}
              required
              className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-stone-900 focus:outline-none resize-y"
              placeholder="This House would..."
            />
            <SpeakButton text={motion.text} label="🔊" />
          </div>
        </div>

        {/* Basic Info - Collapsible */}
        <details open={basicInfoOpen} onToggle={(e) => setBasicInfoOpen(e.target.open)}>
          <summary className="cursor-pointer font-semibold text-sm py-2 list-none flex items-center justify-between border-t border-stone-200 pt-4">
            <span>Basic Info</span>
            <span className="text-stone-400">{basicInfoOpen ? '▲' : '▼'}</span>
          </summary>
          <div className="mt-4 space-y-4 pl-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Motion Type
              </label>
              <select
                value={motion.motionType}
                onChange={(e) => setMotion({ ...motion, motionType: e.target.value })}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-stone-900 focus:outline-none"
              >
                <option value="">-- None --</option>
                {MOTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Tags
              </label>
              <TagInput
                value={motion.tags}
                onChange={(tags) => setMotion({ ...motion, tags })}
                suggestions={SUGGESTED_TAGS}
                placeholder="Add tags..."
              />
            </div>
          </div>
        </details>

        {/* Core Clash - Always Expanded */}
        <div className="border-t border-stone-200 pt-4">
          <h3 className="font-semibold text-sm mb-3">Core Clash</h3>
          <div className="pl-4">
            <TagInput
              value={motion.coreClashes}
              onChange={(coreClashes) => setMotion({ ...motion, coreClashes })}
              suggestions={[...new Set(motions.flatMap(m => m.coreClashes || []))].sort()}
              placeholder="e.g. Innovation vs Safety"
            />
            <p className="text-xs text-stone-500 mt-2">
              The central tension both sides are fighting over
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-2">
            Characterization / Status Quo
          </label>
          <textarea
            value={motion.characterization}
            onChange={(e) => setMotion({ ...motion, characterization: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-stone-900 focus:outline-none resize-y"
            placeholder="Background and framing of the debate..."
          />
        </div>

        {/* Pro Arguments */}
        <div className="border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Pro Arguments</h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => { ensureArgs('prop'); expandAll('prop') }}
                className="text-stone-600 hover:text-stone-900"
              >
                Expand All
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => collapseAll('prop')}
                className="text-stone-600 hover:text-stone-900"
              >
                Collapse All
              </button>
            </div>
          </div>
          <div className="pl-4 space-y-3">
            {(motion.propArgs || []).slice(0, 3).map((arg, i) => (
              <div key={i} className="border border-stone-200 rounded-lg">
                <div
                  onClick={() => toggleArgExpanded('prop', i)}
                  className="cursor-pointer p-3 flex items-center justify-between hover:bg-stone-50"
                >
                  <span className="text-sm font-medium">Pro Argument {i + 1}</span>
                  <span className="text-stone-400">{expandedArgs.prop[i] ? '▲' : '▼'}</span>
                </div>
                {expandedArgs.prop[i] && (
                  <div className="p-3 border-t border-stone-200">
                    <ArgumentEditor
                      index={i}
                      side="prop"
                      value={arg}
                      onChange={(newArg) => updateArg('prop', i, newArg)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Con Arguments */}
        <div className="border-t border-stone-200 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Con Arguments</h3>
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => { ensureArgs('opp'); expandAll('opp') }}
                className="text-stone-600 hover:text-stone-900"
              >
                Expand All
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => collapseAll('opp')}
                className="text-stone-600 hover:text-stone-900"
              >
                Collapse All
              </button>
            </div>
          </div>
          <div className="pl-4 space-y-3">
            {(motion.oppArgs || []).slice(0, 3).map((arg, i) => (
              <div key={i} className="border border-stone-200 rounded-lg">
                <div
                  onClick={() => toggleArgExpanded('opp', i)}
                  className="cursor-pointer p-3 flex items-center justify-between hover:bg-stone-50"
                >
                  <span className="text-sm font-medium">Con Argument {i + 1}</span>
                  <span className="text-stone-400">{expandedArgs.opp[i] ? '▲' : '▼'}</span>
                </div>
                {expandedArgs.opp[i] && (
                  <div className="p-3 border-t border-stone-200">
                    <ArgumentEditor
                      index={i}
                      side="opp"
                      value={arg}
                      onChange={(newArg) => updateArg('opp', i, newArg)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Post-Round Review - Collapsible */}
        <details open={reviewOpen} onToggle={(e) => setReviewOpen(e.target.open)} className="border-t border-stone-200 pt-4">
          <summary className="cursor-pointer font-semibold text-sm py-2 list-none flex items-center justify-between">
            <span>Post-Round Review</span>
            <span className="text-stone-400">{reviewOpen ? '▲' : '▼'}</span>
          </summary>
          <div className="mt-4 space-y-4 pl-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Adjudicator Feedback
              </label>
              <textarea
                value={motion.postRoundReview?.adjudicatorFeedback || ''}
                onChange={(e) => setMotion({
                  ...motion,
                  postRoundReview: {
                    ...motion.postRoundReview,
                    adjudicatorFeedback: e.target.value
                  }
                })}
                rows={4}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-stone-900 focus:outline-none resize-y"
                placeholder="Notes from judge's feedback..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-2">
                Next Improvement
              </label>
              <textarea
                value={motion.postRoundReview?.nextImprovement || ''}
                onChange={(e) => setMotion({
                  ...motion,
                  postRoundReview: {
                    ...motion.postRoundReview,
                    nextImprovement: e.target.value
                  }
                })}
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:border-stone-900 focus:outline-none resize-y"
                placeholder="What to improve next time..."
              />
            </div>
          </div>
        </details>
      </div>
    </form>
  )
}
