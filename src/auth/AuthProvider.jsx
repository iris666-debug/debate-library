import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../firebase/config'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  useEffect(() => {
    if (!isFirebaseConfigured) return
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const value = {
    user,
    loading,
    isConfigured: isFirebaseConfigured,
    login: (email, password) => signInWithEmailAndPassword(auth, email, password),
    loginWithGoogle: () => {
      const provider = new GoogleAuthProvider()
      return signInWithPopup(auth, provider)
    },
    logout: () => signOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
