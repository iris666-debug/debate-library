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

export function vocabCol(uid) {
  return collection(db, 'users', uid, 'vocab')
}

export function makeEmptyVocabItem() {
  return {
    term_en: '',
    meaning_zh: '',
    usage_note: '',
    linkedMotionIds: [],
  }
}

export async function getVocabItem(uid, id) {
  const snap = await getDoc(doc(vocabCol(uid), id))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function createVocabItem(uid, data) {
  return addDoc(vocabCol(uid), {
    ...data,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
}

export async function updateVocabItem(uid, id, data) {
  return updateDoc(doc(vocabCol(uid), id), {
    ...data,
    updatedAt: serverTimestamp(),
  })
}

export async function deleteVocabItem(uid, id) {
  return deleteDoc(doc(vocabCol(uid), id))
}
