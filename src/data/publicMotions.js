import {
  collection,
  doc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

export function publicMotionsCol() {
  return collection(db, 'publicMotions')
}

export async function importPublicMotions(csvRows) {
  const batches = []
  for (let i = 0; i < csvRows.length; i += 450) {
    batches.push(csvRows.slice(i, i + 450))
  }

  let imported = 0
  for (const batch of batches) {
    const wb = writeBatch(db)
    batch.forEach((row) => {
      const ref = doc(publicMotionsCol())
      wb.set(ref, {
        ...row,
        createdAt: serverTimestamp(),
      })
    })
    await wb.commit()
    imported += batch.length
  }

  return imported
}
