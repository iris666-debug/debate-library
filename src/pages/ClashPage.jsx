import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useUserCollection } from '../hooks/useCollection'
import { useAuth } from '../auth/AuthProvider'
import clashKnowledge from '../data/clashKnowledge.json'
import {
  collection,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

export default function ClashPage() {
  const { user } = useAuth()
  const { items: motions } = useUserCollection('motions', {
    orderBy: 'updatedAt',
    orderDir: 'desc',
  })
  const { items: customClashes } = useUserCollection('customClashes', {
    orderBy: 'createdAt',
    orderDir: 'asc',
  })

  const [selectedClash, setSelectedClash] = useState('')
  const [newClashName, setNewClashName] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [saving, setSaving] = useState(false)

  // 从知识库提取所有 clash 名称
  const knowledgeClashes = useMemo(() => {
    const clashNames = new Set()
    clashKnowledge.forEach((tag) => {
      tag.clashes.forEach((clash) => {
        clashNames.add(clash.name)
      })
    })
    return Array.from(clashNames)
  }, [])

  // 从题卡聚合所有 coreClash 值
  const motionClashes = useMemo(() => {
    const clashNames = new Set()
    motions.forEach((m) => {
      // 兼容新旧格式
      if (m.coreClashes && Array.isArray(m.coreClashes)) {
        m.coreClashes.forEach((c) => clashNames.add(c))
      } else if (m.coreClash) {
        clashNames.add(m.coreClash)
      }
    })
    return Array.from(clashNames)
  }, [motions])

  // 合并去重并排序，0题卡的放底部
  const allClashes = useMemo(() => {
    const clashCounts = new Map()

    // 统计每个clash的题卡数
    const combined = new Set([
      ...knowledgeClashes,
      ...motionClashes,
      ...customClashes.map((c) => c.name),
    ])

    combined.forEach((clash) => {
      const count = motions.filter((m) => {
        const clashes = m.coreClashes || (m.coreClash ? [m.coreClash] : [])
        return clashes.includes(clash)
      }).length
      clashCounts.set(clash, count)
    })

    // 分组：有题卡 vs 无题卡
    const withMotions = []
    const withoutMotions = []

    combined.forEach((clash) => {
      if (clashCounts.get(clash) > 0) {
        withMotions.push(clash)
      } else {
        withoutMotions.push(clash)
      }
    })

    // 按字母排序（A-Z）
    withMotions.sort((a, b) => a.localeCompare(b, 'en'))
    withoutMotions.sort((a, b) => a.localeCompare(b, 'en'))

    return [...withMotions, ...withoutMotions]
  }, [knowledgeClashes, motionClashes, customClashes, motions])

  // 搜索过滤
  const filteredClashes = useMemo(() => {
    if (!searchTerm.trim()) return allClashes
    const term = searchTerm.toLowerCase()
    return allClashes.filter((clash) => clash.toLowerCase().includes(term))
  }, [allClashes, searchTerm])

  // 筛选包含选中 clash 的题卡
  const filteredMotions = useMemo(() => {
    if (!selectedClash) return []
    return motions.filter((m) => {
      const clashes = m.coreClashes || (m.coreClash ? [m.coreClash] : [])
      return clashes.includes(selectedClash)
    })
  }, [selectedClash, motions])

  const handleAddCustomClash = async () => {
    if (!newClashName.trim()) return

    setSaving(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'customClashes'), {
        name: newClashName.trim(),
        createdAt: serverTimestamp(),
      })
      setNewClashName('')
    } catch (err) {
      alert('保存失败: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <div className="p-6 border-b border-stone-200">
        <h1 className="text-2xl font-semibold">Core Clash 浏览</h1>
        <p className="text-sm text-stone-500 mt-1">
          浏览所有核心矛盾结构，查看相关题卡
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* 左侧 Clash 列表 */}
        <div className="w-80 border-r border-stone-200 flex flex-col">
          <div className="p-4 border-b border-stone-200">
            <h2 className="text-sm font-semibold text-stone-700 mb-3">
              所有 Core Clash ({filteredClashes.length})
            </h2>
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索 Clash..."
              className="w-full px-3 py-2 text-sm border border-stone-300 rounded-lg focus:border-stone-900 focus:outline-none"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filteredClashes.map((clash) => {
              const count = motions.filter((m) => {
                const clashes = m.coreClashes || (m.coreClash ? [m.coreClash] : [])
                return clashes.includes(clash)
              }).length

              // 提取英文和中文名称，格式化为"English（中文）"
              const match = clash.match(/^(.+?)（(.+?)）$/)
              let displayName = clash
              if (match) {
                // 已经是"英文（中文）"或"中文（英文）"格式
                const [, part1, part2] = match
                const isChinese = (str) => /[一-龥]/.test(str)
                if (isChinese(part1) && !isChinese(part2)) {
                  // "中文（英文）" -> "English（中文）"
                  displayName = `${part2}（${part1}）`
                } else {
                  // 已经是正确格式
                  displayName = clash
                }
              } else {
                // 尝试匹配"中文 (English)"格式
                const reverseMatch = clash.match(/^(.+?)\s*\((.+?)\)$/)
                if (reverseMatch) {
                  const [, part1, part2] = reverseMatch
                  const isChinese = (str) => /[一-龥]/.test(str)
                  if (isChinese(part1) && !isChinese(part2)) {
                    displayName = `${part2}（${part1}）`
                  }
                }
              }

              return (
                <button
                  key={clash}
                  onClick={() => setSelectedClash(clash)}
                  className={
                    'w-full text-left px-3 py-2 rounded-lg text-sm transition ' +
                    (selectedClash === clash
                      ? 'bg-stone-900 text-white'
                      : 'bg-stone-100 hover:bg-stone-200 text-stone-700')
                  }
                >
                  <div className="font-medium">{displayName}</div>
                  <div className={
                    'text-xs mt-0.5 ' + (count === 0 ? 'opacity-40' : 'opacity-75')
                  }>
                    {count === 0 ? 'No motions' : `${count} motion${count > 1 ? 's' : ''}`}
                  </div>
                </button>
              )
            })}
          </div>
      </div>

        {/* 右侧题卡列表 */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedClash ? (
            <div className="text-center text-stone-400 mt-12">
              ← 从左侧选择一个 Core Clash 查看相关题卡
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  {selectedClash}
                  <span className="text-sm text-stone-500 ml-2 font-normal">
                    ({filteredMotions.length} 道题)
                  </span>
                </h2>
              </div>

              {filteredMotions.length === 0 ? (
                <div className="text-sm text-stone-500">
                  还没有题卡标记了这个 Core Clash
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredMotions.map((m) => (
                    <Link
                      key={m.id}
                      to={`/motions/${m.id}`}
                      className="bg-white border border-stone-200 rounded-lg p-4 hover:border-stone-400 hover:shadow-sm transition"
                    >
                      <p className="font-medium leading-snug line-clamp-2">
                        {m.text}
                      </p>
                      {m.source && (
                        <p className="text-xs text-stone-500 mt-2">{m.source}</p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {m.motionType && (
                          <span className="bg-stone-700 text-white rounded-md px-2 py-0.5 text-xs">
                            {m.motionType}
                          </span>
                        )}
                        {(m.tags || []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="bg-stone-100 text-stone-700 rounded-md px-2 py-0.5 text-xs"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 底部自定义 Clash 输入框 */}
      <div className="border-t border-stone-200 p-4 bg-stone-50">
        <div className="flex items-center gap-3 max-w-2xl">
          <input
            type="text"
            value={newClashName}
            onChange={(e) => setNewClashName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCustomClash()}
            placeholder="添加自定义 Core Clash（如 Innovation vs Safety）"
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm"
          />
          <button
            onClick={handleAddCustomClash}
            disabled={!newClashName.trim() || saving}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm hover:bg-stone-800 disabled:opacity-50"
          >
            {saving ? '保存中…' : '添加'}
          </button>
        </div>
        <p className="text-xs text-stone-500 mt-2">
          自定义的 Core Clash 会保存到你的个人列表，在编辑题卡时可以看到
        </p>
      </div>
    </div>
  )
}
