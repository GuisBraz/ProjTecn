import React, { createContext, useContext, useEffect, useState } from 'react'
import { auth, db } from './firebase'
import {
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore'
import { codeToRole } from './permissions'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null) // { displayName, role, email }
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid))
          setProfile(snap.exists() ? snap.data() : null)
        } catch {
          setProfile(null)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = (email, password) => signInWithEmailAndPassword(auth, email, password)

  // accessCode: um dos 4 códigos válidos (ex: '01001'). displayName: nome de exibição.
  const signUp = async (email, password, accessCode, displayName) => {
    const role = codeToRole(accessCode)
    if (!role) {
      const err = new Error('Código de acesso inválido.')
      err.code = 'auth/invalid-access-code'
      throw err
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    if (displayName) {
      await updateProfile(cred.user, { displayName })
    }
    const profileData = {
      email,
      displayName: displayName || email.split('@')[0],
      role,
      createdAt: serverTimestamp(),
    }
    await setDoc(doc(db, 'users', cred.user.uid), profileData)
    setProfile(profileData)
    return cred
  }

  const updateDisplayName = async (newName) => {
    if (!user) return
    await updateProfile(user, { displayName: newName })
    await updateDoc(doc(db, 'users', user.uid), { displayName: newName })
    setProfile((p) => (p ? { ...p, displayName: newName } : p))
  }

  const signOut = () => fbSignOut(auth)

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, updateDisplayName }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
