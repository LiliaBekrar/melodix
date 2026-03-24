/**
 * useAuth.ts
 * Context et hook pour gérer l'état d'authentification Spotify
 */

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import {
  getStoredTokens, isTokenValid, clearTokens,
  loginWithSpotify, exchangeCodeForToken
} from '@/services/spotifyAuth'
import { getCurrentUser } from '@/services/spotifyApi'
import type { SpotifyUser } from '@/types/spotify'

interface AuthContextValue {
  user: SpotifyUser | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: () => void
  logout: () => void
  handleCallback: (code: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SpotifyUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tente de restaurer la session depuis localStorage au démarrage
  useEffect(() => {
    const tokens = getStoredTokens()
    if (tokens && isTokenValid(tokens)) {
      getCurrentUser()
        .then(setUser)
        .catch(() => { clearTokens(); setUser(null) })
        .finally(() => setIsLoading(false))
    } else {
      if (tokens) clearTokens()
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(() => {
    loginWithSpotify()
  }, [])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
    setError(null)
  }, [])

  const handleCallback = useCallback(async (code: string) => {
    setIsLoading(true)
    setError(null)
    try {
      await exchangeCodeForToken(code)
      const me = await getCurrentUser()
      setUser(me)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion')
      clearTokens()
    } finally {
      setIsLoading(false)
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      error,
      login,
      logout,
      handleCallback,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider')
  return ctx
}
