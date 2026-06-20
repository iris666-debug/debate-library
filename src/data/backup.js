import {
  doc,
  getDocs,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { motionsCol } from './motions'
import { modulesCol } from './modules'

const BACKUP_VERSION = 1

function stripMeta(obj) {
  const { createdAt, updatedAt, ...rest } = obj
  return rest
}

export async function exportAllData(uid) {
  const [modSnap, motSnap] = await Promise.all([
    getDocs(modulesCol(uid)),
    getDocs(motionsCol(uid)),
  ])
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    modules: modSnap.docs.map((d) => ({ id: d.id, ...stripMeta(d.data()) })),
    motions: motSnap.docs.map((d) => ({ id: d.id, ...stripMeta(d.data()) })),
  }
}

export function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function validateBackup(parsed) {
  if (!parsed || typeof parsed !== 'object')
    throw new Error('文件结构不对:看起来不是辩题库的备份文件')
  if (!Array.isArray(parsed.modules))
    throw new Error('文件里没找到模块数据(应有 "modules" 字段)')
  if (!Array.isArray(parsed.motions))
    throw new Error('文件里没找到题卡数据(应有 "motions" 字段)')
  return parsed
}

export async function getCurrentCounts(uid) {
  const [modSnap, motSnap] = await Promise.all([
    getDocs(modulesCol(uid)),
    getDocs(motionsCol(uid)),
  ])
  return { moduleCount: modSnap.size, motionCount: motSnap.size }
}

async function commitOps(ops) {
  for (let i = 0; i < ops.length; i += 450) {
    const batch = writeBatch(db)
    ops.slice(i, i + 450).forEach((op) => op(batch))
    await batch.commit()
  }
}

export async function importData(uid, data, mode) {
  const { modules = [], motions = [] } = data

  if (mode === 'overwrite') {
    const [modSnap, motSnap] = await Promise.all([
      getDocs(modulesCol(uid)),
      getDocs(motionsCol(uid)),
    ])
    await commitOps([
      ...modSnap.docs.map((d) => (b) => b.delete(d.ref)),
      ...motSnap.docs.map((d) => (b) => b.delete(d.ref)),
    ])
  }

  const moduleIdMap = {}
  await commitOps(
    modules.map((m) => (b) => {
      const { id: oldId, ...rest } = m
      const newRef = doc(modulesCol(uid))
      moduleIdMap[oldId] = newRef.id
      b.set(newRef, {
        ...rest,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  )

  await commitOps(
    motions.map((m) => (b) => {
      const { id: _oldId, ...rest } = m
      const newRef = doc(motionsCol(uid))
      const remappedIds = (rest.linkedModuleIds || [])
        .map((mid) => moduleIdMap[mid])
        .filter(Boolean)
      b.set(newRef, {
        ...rest,
        linkedModuleIds: remappedIds,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  )

  return { moduleCount: modules.length, motionCount: motions.length }
}
