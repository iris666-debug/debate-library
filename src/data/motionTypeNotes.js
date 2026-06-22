import {
  collection,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { MOTION_TYPES } from './debateTaxonomy'

export function motionTypeNotesCol(uid) {
  return collection(db, 'users', uid, 'motionTypeNotes')
}

export function makeEmptyNote(motionType) {
  return {
    motionType,
    coreRequirement: '',
    propFocus: '',
    oppFocus: '',
    commonMistakes: '',
    examples: '',
  }
}

export async function getMotionTypeNote(uid, motionType) {
  const snap = await getDoc(doc(motionTypeNotesCol(uid), motionType))
  if (!snap.exists()) {
    return makeEmptyNote(motionType)
  }
  return { id: snap.id, ...snap.data() }
}

export async function saveMotionTypeNote(uid, motionType, data) {
  return setDoc(doc(motionTypeNotesCol(uid), motionType), {
    ...data,
    motionType,
    updatedAt: serverTimestamp(),
  })
}

export async function initializeMotionTypeNotes(uid) {
  const promises = MOTION_TYPES.map((t) =>
    setDoc(
      doc(motionTypeNotesCol(uid), t.value),
      {
        ...makeEmptyNote(t.value),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    )
  )
  await Promise.all(promises)
}
