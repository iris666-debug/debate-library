import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import { createVocabItem, updateVocabItem, deleteVocabItem } from '../data/vocab'
import VocabFormModal from '../components/VocabFormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import SpeakButton from '../components/SpeakButton'
import { DEBATE_TERMS } from '../data/debateTerms'

export default function VocabListPage() {
  const { user } = useAuth()
  const { items: vocab } = useUserCollection('vocab', {
    orderBy: 'createdAt',
    orderDir: 'desc',
  })
  const { items: motions } = useUserCollection('motions', {
    orderBy: 'createdAt',
    orderDir: 'asc',
  })

  const [tab, setTab] = useState('jargon')
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')
  const [jargonSearch, setJargonSearch] = useState('')

  const motionMap = useMemo(() => {
    const m = {}
    motions.forEach((x) => {
      m[x.id] = x
    })
    return m
  }, [motions])

  const filtered = useMemo(() => {
    if (!search.trim()) return vocab
    const s = search.toLowerCase()
    return vocab.filter((v) => {
      const term = (v.term_en || v.term_zh || '').toLowerCase()
      const def = (v.definition_en || v.definition_zh || '').toLowerCase()
      return term.includes(s) || def.includes(s)
    })
  }, [vocab, search])

  const filteredJargon = useMemo(() => {
    if (!jargonSearch.trim()) return DEBATE_TERMS
    const s = jargonSearch.toLowerCase()
    return DEBATE_TERMS.filter((t) => {
      return (
        t.term.toLowerCase().includes(s) ||
        t.zh.toLowerCase().includes(s) ||
        t.definition.toLowerCase().includes(s)
      )
    })
  }, [jargonSearch])

  const handleSubmit = async (data) => {
    if (editing && editing.id) {
      await updateVocabItem(user.uid, editing.id, data)
    } else {
      await createVocabItem(user.uid, data)
    }
    setModalOpen(false)
    setEditing(null)
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteVocabItem(user.uid, deleting.id)
    setDeleting(null)
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Vocabulary</h1>
        <p className="text-sm text-stone-500 mt-1">
          {tab === 'jargon'
            ? 'BP debate terminology reference'
            : 'Your personal vocabulary bank'}
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => setTab('jargon')}
          className={
            'px-4 py-2 text-sm font-medium transition ' +
            (tab === 'jargon'
              ? 'border-b-2 border-stone-900 text-stone-900'
              : 'text-stone-500 hover:text-stone-900')
          }
        >
          BP Jargon
        </button>
        <button
          onClick={() => setTab('my-vocab')}
          className={
            'px-4 py-2 text-sm font-medium transition ' +
            (tab === 'my-vocab'
              ? 'border-b-2 border-stone-900 text-stone-900'
              : 'text-stone-500 hover:text-stone-900')
          }
        >
          My Vocabulary
        </button>
      </div>

      {tab === 'jargon' ? (
        <div className="space-y-4">
          <input
            type="search"
            value={jargonSearch}
            onChange={(e) => setJargonSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full px-4 py-2 border border-stone-300 rounded-lg text-sm"
          />
          <div className="space-y-3">
            {filteredJargon.map((term, idx) => (
              <div key={idx} className="bg-white border border-stone-200 rounded-xl p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{term.term}</h3>
                    <p className="text-sm text-stone-500">{term.zh}</p>
                  </div>
                  <SpeakButton text={term.definition + '. For example: ' + term.example} />
                </div>
                <p className="text-sm text-stone-700">{term.definition}</p>
                <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600 italic">
                  Example: {term.example}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search vocabulary..."
              className="flex-1 px-4 py-2 border border-stone-300 rounded-lg text-sm"
            />
            <button
              onClick={() => {
                setEditing(null)
                setModalOpen(true)
              }}
              className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800"
            >
              + Add Word
            </button>
          </div>

          {filtered.length === 0 && (
            <div className="bg-white border border-dashed border-stone-300 rounded-xl p-8 text-center">
              <p className="text-stone-500 text-sm">
                {vocab.length === 0
                  ? 'No vocabulary yet. Add your first word!'
                  : 'No matches found.'}
              </p>
            </div>
          )}

          <div className="grid gap-3">
            {filtered.map((v) => {
              const linkedMotion = v.linkedMotionId ? motionMap[v.linkedMotionId] : null
              return (
                <div
                  key={v.id}
                  className="bg-white border border-stone-200 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{v.term_en || v.term_zh}</span>
                        {v.term_en && v.term_zh && (
                          <span className="text-sm text-stone-500">({v.term_zh})</span>
                        )}
                      </div>
                      {(v.definition_en || v.definition_zh) && (
                        <p className="text-sm text-stone-600 mt-1">
                          {v.definition_en || v.definition_zh}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <SpeakButton text={v.term_en || v.term_zh} />
                      <button
                        onClick={() => {
                          setEditing(v)
                          setModalOpen(true)
                        }}
                        className="px-2 py-1 text-xs text-stone-600 hover:text-stone-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleting(v)}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  {linkedMotion && (
                    <Link
                      to={`/motions/${linkedMotion.id}/edit`}
                      className="inline-block text-xs text-blue-600 hover:underline"
                    >
                      → {linkedMotion.text}
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {modalOpen && (
        <VocabFormModal
          initial={editing}
          motions={motions}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditing(null)
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete Vocabulary"
          message={`Delete "${deleting.term_en || deleting.term_zh}"?`}
          confirmText="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
