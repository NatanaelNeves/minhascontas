import { useState, useEffect } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  async function login() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, isLoading, login, logout }
}
