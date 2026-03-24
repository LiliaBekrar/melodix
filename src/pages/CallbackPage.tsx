/**
 * CallbackPage.tsx
 * Gère le retour de Spotify après l'authentification OAuth PKCE
 */

import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/ui'

export function CallbackPage() {
  const [params] = useSearchParams()
  const { handleCallback, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const code  = params.get('code')
    const error = params.get('error')

    if (error) {
      navigate('/?error=' + error)
      return
    }

    if (code) {
      handleCallback(code).then(() => {
        navigate('/dashboard', { replace: true })
      }).catch(() => {
        navigate('/', { replace: true })
      })
    } else {
      navigate('/', { replace: true })
    }
  }, []) // eslint-disable-line

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center gap-6">
      <Spinner size={40} />
      <div className="text-center">
        <p className="font-display font-semibold text-white text-lg">Connexion en cours…</p>
        <p className="text-[--text-secondary] text-sm mt-1">Vérification de votre compte Spotify</p>
      </div>
    </div>
  )
}
