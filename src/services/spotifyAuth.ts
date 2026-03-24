/**
 * spotifyAuth.ts
 * Gestion de l'authentification Spotify via OAuth 2.0 PKCE
 * Fonctionne 100% côté client, sans backend.
 */

import type { SpotifyTokens } from '@/types/spotify'
import appConfig from '@/config/appConfig'

// ── Configuration ─────────────────────────────────────────────────────────────
// ⚠️ Remplacez ces valeurs par celles de votre app Spotify Developer Dashboard
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || 'VOTRE_CLIENT_ID_ICI'

function getDefaultRedirectUri(): string {
  const repoName = import.meta.env.VITE_REPOSITORY_NAME || appConfig.repositoryName
  const isGithubPagesProject = (import.meta.env.VITE_GITHUB_PAGES_PROJECT || String(appConfig.githubPagesProject)).toLowerCase() === 'true'
  const callbackPath = isGithubPagesProject ? `/${repoName}/callback` : '/callback'
  return `${window.location.origin}${callbackPath}`
}

const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || getDefaultRedirectUri()

const SCOPES = [
  'user-top-read',
  'user-read-recently-played',
  'user-read-private',
  'user-read-email',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
].join(' ')

const STORAGE_KEY = 'spotify_tokens'
const CODE_VERIFIER_KEY = 'spotify_code_verifier'

// ── PKCE Helpers ──────────────────────────────────────────────────────────────

function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => chars[byte % chars.length]).join('')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

// ── Auth Flow ─────────────────────────────────────────────────────────────────

/** Lance la redirection vers Spotify pour l'authentification */
export async function loginWithSpotify(): Promise<void> {
  const verifier = generateRandomString(128)
  const challenge = await generateCodeChallenge(verifier)

  sessionStorage.setItem(CODE_VERIFIER_KEY, verifier)

  const params = new URLSearchParams({
    client_id:             CLIENT_ID,
    response_type:         'code',
    redirect_uri:          REDIRECT_URI,
    scope:                 SCOPES,
    code_challenge_method: 'S256',
    code_challenge:        challenge,
    state:                 generateRandomString(16),
  })

  window.location.href = `https://accounts.spotify.com/authorize?${params}`
}

/** Échange le code d'autorisation contre un access token */
export async function exchangeCodeForToken(code: string): Promise<SpotifyTokens> {
  const verifier = sessionStorage.getItem(CODE_VERIFIER_KEY)
  if (!verifier) throw new Error('Code verifier manquant. Recommencez la connexion.')

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    grant_type:    'authorization_code',
    code,
    redirect_uri:  REDIRECT_URI,
    code_verifier: verifier,
  })

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) {
    const err = await response.json()
    throw new Error(`Erreur token: ${err.error_description || err.error}`)
  }

  const data = await response.json()
  const tokens: SpotifyTokens = {
    ...data,
    expires_at: Date.now() + data.expires_in * 1000,
  }

  saveTokens(tokens)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
  return tokens
}

/** Rafraîchit le token si expiré */
export async function refreshAccessToken(tokens: SpotifyTokens): Promise<SpotifyTokens> {
  if (!tokens.refresh_token) throw new Error('Pas de refresh token disponible.')

  const body = new URLSearchParams({
    client_id:     CLIENT_ID,
    grant_type:    'refresh_token',
    refresh_token: tokens.refresh_token,
  })

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  if (!response.ok) throw new Error('Échec du refresh token')

  const data = await response.json()
  const newTokens: SpotifyTokens = {
    ...tokens,
    access_token: data.access_token,
    expires_in:   data.expires_in,
    expires_at:   Date.now() + data.expires_in * 1000,
    refresh_token: data.refresh_token || tokens.refresh_token,
  }

  saveTokens(newTokens)
  return newTokens
}

// ── Storage ───────────────────────────────────────────────────────────────────

export function saveTokens(tokens: SpotifyTokens): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function getStoredTokens(): SpotifyTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function isTokenValid(tokens: SpotifyTokens): boolean {
  return Date.now() < tokens.expires_at - 60_000 // marge 1 min
}

export function clearTokens(): void {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(CODE_VERIFIER_KEY)
}

/** Retourne un token valide (rafraîchi si besoin) */
export async function getValidToken(): Promise<string> {
  const tokens = getStoredTokens()
  if (!tokens) throw new Error('Non connecté')

  if (isTokenValid(tokens)) return tokens.access_token

  const refreshed = await refreshAccessToken(tokens)
  return refreshed.access_token
}
