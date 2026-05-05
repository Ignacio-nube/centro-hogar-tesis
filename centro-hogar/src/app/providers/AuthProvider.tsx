import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { authService } from '@/features/auth/services/authService'
import type { Profile } from '@/types/app.types'

interface AuthUser {
  id: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    try {
      const p = await authService.getProfile(userId)
      setProfile(p)
    } catch {
      setProfile(null)
    }
  }, [])

  const refreshProfile = useCallback(async () => {
    if (user) await loadProfile(user.id)
  }, [user, loadProfile])

  useEffect(() => {
    let cancelled = false
    authService.getCurrentUser()
      .then(async (u) => {
        if (cancelled) return
        if (u) {
          setUser({ id: u.id, email: u.email })
          await loadProfile(u.id)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setIsLoading(false) })

    return () => { cancelled = true }
  }, [loadProfile])

  const signIn = useCallback(async (email: string, password: string) => {
    const data = await authService.signIn(email, password)
    if (data?.usuario) {
      const userId = String(data.usuario.id)
      setUser({ id: userId, email: data.usuario.email })
      await loadProfile(userId)
    }
  }, [loadProfile])

  const signOut = useCallback(async () => {
    await authService.signOut()
    setUser(null)
    setProfile(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      isLoading,
      isAuthenticated: !!user && !!profile,
      signIn,
      signOut,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
