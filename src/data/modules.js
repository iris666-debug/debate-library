import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { motionsCol } from './motions'

export function modulesCol(uid) {
  return collection(db, 'users', uid, 'modules')
}

export async function getModule(uid, id) {
  const snap = await getDoc(doc(modulesCol(uid), id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function createModule(uid, data) {
  return addDoc(modulesCol(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateModule(uid, id, data) {
  return updateDoc(doc(modulesCol(uid), id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function getMotionsLinkedToModule(uid, moduleId) {
  const q = query(
    motionsCol(uid),
    where('linkedModuleIds', 'array-contains', moduleId)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Deletes the module AND removes its id from every motion's linkedModuleIds.
// Returns how many motions were cleaned up.
export async function deleteModule(uid, moduleId) {
  const linked = await getMotionsLinkedToModule(uid, moduleId)
  const batch = writeBatch(db)
  linked.forEach((m) => {
    const newIds = (m.linkedModuleIds || []).filter((x) => x !== moduleId)
    batch.update(doc(motionsCol(uid), m.id), {
      linkedModuleIds: newIds,
      updatedAt: serverTimestamp(),
    })
  })
  batch.delete(doc(modulesCol(uid), moduleId))
  await batch.commit()
  return linked.length
}

// Kept for explicit non-cascading scenarios; not currently used.
export async function deleteModuleOnly(uid, id) {
  return deleteDoc(doc(modulesCol(uid), id))
}
