import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthProvider'
import { useUserCollection } from '../hooks/useCollection'
import { createVocabItem, updateVocabItem, deleteVocabItem } from '../data/vocab'
import VocabFormModal from '../components/VocabFormModal'
import ConfirmDialog from '../components/ConfirmDialog'
import SpeakButton from '../components/SpeakButton'

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

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [search, setSearch] = useState('')

  const motionMap = useMemo(() => {
    const m = {}
    motions.forEach((x) => {
      m[x.id] = x
    })
    return m
  }, [motions])

  const filtered = useMemo(() => {
    if (!search.trim()) return vocab
    const q = search.trim().toLowerCase()
    return vocab.filter(
      (v) =>
        v.term_en.toLowerCase().includes(q) ||
        (v.meaning_zh && v.meaning_zh.toLowerCase().includes(q))
    )
  }, [vocab, search])

  const handleSave = async (data) => {
    if (editing) {
      await updateVocabItem(user.uid, editing.id, data)
    } else {
      await createVocabItem(user.uid, data)
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    await deleteVocabItem(user.uid, deleting.id)
    setDeleting(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl font-semibold">
          生词本
          {vocab.length > 0 && (
            <span className="ml-2 text-sm text-stone-500 font-normal">
              {vocab.length} 个词汇
            </span>
          )}
        </h1>
        <button
          onClick={() => {
            setEditing(null)
            setModalOpen(true)
          }}
          className="px-4 py-1.5 rounded-lg bg-stone-900 text-white text-sm hover:bg-stone-800"
        >
          新增词汇
        </button>
      </div>

      {vocab.length > 0 && (
        <input
          type="text"
          placeholder="搜索英文词汇或中文释义..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm"
        />
      )}

      {vocab.length === 0 ? (
        <div className="text-sm text-stone-500 bg-stone-50 border border-stone-200 rounded-lg p-6">
          还没有词汇。辩论里的专业词汇（比如 power asymmetry、binding
          arbitration）值得长期积累，点上方"新增词汇"开始记录。
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((v) => {
            const linkedMotions = (v.linkedMotionIds || [])
              .map((mid) => motionMap[mid])
              .filter(Boolean)
            return (
              <div
                key={v.id}
                className="bg-white border border-stone-200 rounded-2xl p-4 space-y-3"
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{v.term_en}</h3>
                      <SpeakButton text={v.term_en} label="" />
                    </div>
                    {v.meaning_zh && (
                      <p className="text-stone-600 mt-1">{v.meaning_zh}</p>
                    )}
                  </div>
                </div>
                {v.usage_note && (
                  <div className="bg-stone-50 rounded-lg p-3 text-sm text-stone-600">
                    {v.usage_note}
                  </div>
                )}
                {linkedMotions.length > 0 && (
                  <div className="text-sm">
                    <span className="text-stone-500">来自题卡: </span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {linkedMotions.map((m) => (
                        <Link
                          key={m.id}
                          to={`/motions/${m.id}`}
                          className="text-stone-700 hover:text-stone-900 underline"
                        >
                          {m.text}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2 border-t border-stone-100">
                  <button
                    onClick={() => {
                      setEditing(v)
                      setModalOpen(true)
                    }}
                    className="text-sm text-stone-600 hover:text-stone-900"
                  >
                    编辑
                  </button>
                  <button
                    onClick={() => setDeleting(v)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    删除
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <VocabFormModal
          item={editing}
          motions={motions}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="删除词汇"
          message={`「${deleting.term_en}」将被永久删除，无法恢复。`}
          onConfirm={handleDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
