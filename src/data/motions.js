import {
  collection,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

export function motionsCol(uid) {
  return collection(db, 'users', uid, 'motions')
}

export function makeEmptyArg() {
  return {
    name_en: '',
    name_zh: '',
    claim_en: '',
    claim_zh: '',
    mechanism_en: '',
    mechanism_zh: '',
    comparative_en: '',
    comparative_zh: '',
    impact_en: '',
    impact_zh: '',
    pois: [],
  }
}

export function makeEmptyMotion() {
  return {
    text: '',
    source: '',
    tags: [],
    motionType: '',
    coreClash: '',
    propArgs: [makeEmptyArg(), makeEmptyArg(), makeEmptyArg()],
    oppArgs: [makeEmptyArg(), makeEmptyArg(), makeEmptyArg()],
    linkedModuleIds: [],
  }
}

export async function getMotion(uid, id) {
  const snap = await getDoc(doc(motionsCol(uid), id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function createMotion(uid, data) {
  return addDoc(motionsCol(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateMotion(uid, id, data) {
  return updateDoc(doc(motionsCol(uid), id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteMotion(uid, id) {
  return deleteDoc(doc(motionsCol(uid), id))
}
