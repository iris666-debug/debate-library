import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, orderBy as orderByFn } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../auth/AuthProvider'

export function useUserCollection(name, opts = {}) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const orderField = opts.orderBy || 'createdAt'
  const orderDir = opts.orderDir || 'asc'

  useEffect(() => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }
    setLoading(true)
    const colRef = collection(db, 'users', user.uid, name)
    const q = query(colRef, orderByFn(orderField, orderDir))
    const unsub = onSnapshot(
      q,
      (snap) => {
        setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
        setLoading(false)
      },
      (err) => {
        setError(err)
        setLoading(false)
      }
    )
    return unsub
  }, [user?.uid, name, orderField, orderDir])

  return { items, loading, error }
}
