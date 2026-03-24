/**
 * spotifyApi.ts
 * Toutes les interactions avec l'API Spotify Web API.
 * Compatible avec les changements API 2025/2026 :
 *  - /playlists/{id}/tracks → /playlists/{id}/items
 *  - POST /me/playlists (au lieu de /users/{id}/playlists)
 *  - popularity/followers supprimés des Artists
 *  - search limit max = 10 (pagination requise)
 *  - getArtistTopTracks supprimé → remplacé par search
 */

import { getValidToken } from './spotifyAuth'
import type {
  SpotifyUser, SpotifyTrack, SpotifyArtist,
  SpotifyPlaylist, SpotifyPlaylistFull, SpotifySearchResult, TrackItem
} from '@/types/spotify'

// ── Fetch helper ──────────────────────────────────────────────────────────────

async function spotifyFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = await getValidToken()
  const url = endpoint.startsWith('http')
    ? endpoint
    : `https://api.spotify.com/v1${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (response.status === 204) return {} as T
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.error?.message || `Erreur API Spotify: ${response.status}`)
  }

  return response.json()
}

// ── User ──────────────────────────────────────────────────────────────────────

export async function getCurrentUser(): Promise<SpotifyUser> {
  return spotifyFetch<SpotifyUser>('/me')
}

// ── Top Items ─────────────────────────────────────────────────────────────────

export async function getTopTracks(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit = 20
): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ items: SpotifyTrack[] }>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}`
  )
  return data.items ?? []
}

export async function getTopArtists(
  timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term',
  limit = 20
): Promise<SpotifyArtist[]> {
  const data = await spotifyFetch<{ items: SpotifyArtist[] }>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}`
  )
  return data.items ?? []
}

export async function getRecentlyPlayed(limit = 50): Promise<SpotifyTrack[]> {
  const data = await spotifyFetch<{ items: Array<{ track: SpotifyTrack }> }>(
    `/me/player/recently-played?limit=${limit}`
  )
  return (data.items ?? []).map(i => i.track).filter(Boolean)
}

// ── Search ────────────────────────────────────────────────────────────────────
// Note: limit max = 10 depuis la nouvelle API. Paginer si besoin.

export async function searchArtists(query: string, limit = 10): Promise<SpotifyArtist[]> {
  const p = new URLSearchParams({ q: query, type: 'artist', limit: String(Math.min(limit, 10)) })
  const data = await spotifyFetch<SpotifySearchResult>(`/search?${p}`)
  return data.artists?.items ?? []
}

export async function searchTracks(query: string, limit = 10): Promise<SpotifyTrack[]> {
  const p = new URLSearchParams({ q: query, type: 'track', limit: String(Math.min(limit, 10)) })
  const data = await spotifyFetch<SpotifySearchResult>(`/search?${p}`)
  return data.tracks?.items ?? []
}

export async function searchTracksPaginated(query: string, total = 30): Promise<SpotifyTrack[]> {
  const results: SpotifyTrack[] = []
  let offset = 0
  while (results.length < total) {
    const p = new URLSearchParams({ q: query, type: 'track', limit: '10', offset: String(offset) })
    const data = await spotifyFetch<SpotifySearchResult>(`/search?${p}`)
    const items = data.tracks?.items ?? []
    if (items.length === 0) break
    results.push(...items)
    offset += 10
  }
  return results.slice(0, total)
}

/**
 * Récupère plusieurs pages de recherche (contourne la limite de 10)
 */
export async function searchArtistsPaginated(query: string, total = 30): Promise<SpotifyArtist[]> {
  const results: SpotifyArtist[] = []
  let offset = 0
  while (results.length < total) {
    const p = new URLSearchParams({ q: query, type: 'artist', limit: '10', offset: String(offset) })
    const data = await spotifyFetch<SpotifySearchResult>(`/search?${p}`)
    const items = data.artists?.items ?? []
    if (items.length === 0) break
    results.push(...items)
    offset += 10
  }
  return results.slice(0, total)
}

// ── Artists ───────────────────────────────────────────────────────────────────

export async function getRelatedArtists(artistId: string, artistName?: string, genres: string[] = []): Promise<SpotifyArtist[]> {
  try {
    const data = await spotifyFetch<{ artists: SpotifyArtist[] }>(
      `/artists/${artistId}/related-artists`
    )
    return data.artists ?? []
  } catch {
    const fallbackQueries = [
      artistName ? `artist:"${artistName}"` : '',
      ...genres.slice(0, 2).map(genre => `genre:"${genre}"`),
    ].filter(Boolean)

    if (fallbackQueries.length === 0) return []

    const fallback = await searchArtistsPaginated(fallbackQueries.join(' '), 12).catch(() => [] as SpotifyArtist[])
    return fallback.filter(artist => artist.id !== artistId)
  }
}

export async function getArtist(artistId: string): Promise<SpotifyArtist> {
  return spotifyFetch<SpotifyArtist>(`/artists/${artistId}`)
}

/**
 * Récupère les titres d'un artiste via search (remplace getArtistTopTracks supprimé)
 */
export async function getArtistTopTracks(artistId: string, artistName: string): Promise<SpotifyTrack[]> {
  // Cherche les titres les plus connus de cet artiste via search
  const tracks = await searchTracks(`artist:"${artistName}"`, 10)
  return tracks.filter(t => t.artists.some(a => a.id === artistId))
}

// ── Recommendations ───────────────────────────────────────────────────────────

interface RecommendationParams {
  seed_tracks?: string[]
  seed_artists?: string[]
  seed_genres?: string[]
  target_energy?: number
  target_valence?: number
  target_danceability?: number
  min_tempo?: number
  max_tempo?: number
  limit?: number
}

export async function getRecommendations(params: RecommendationParams): Promise<SpotifyTrack[]> {
  const p = new URLSearchParams()
  if (params.seed_tracks?.length)   p.set('seed_tracks',   params.seed_tracks.slice(0, 5).join(','))
  if (params.seed_artists?.length)  p.set('seed_artists',  params.seed_artists.slice(0, 5).join(','))
  if (params.seed_genres?.length)   p.set('seed_genres',   params.seed_genres.slice(0, 5).join(','))
  if (params.target_energy != null) p.set('target_energy', String(params.target_energy))
  if (params.target_valence != null)p.set('target_valence',String(params.target_valence))
  if (params.target_danceability != null) p.set('target_danceability', String(params.target_danceability))
  if (params.min_tempo)             p.set('min_tempo',     String(params.min_tempo))
  if (params.max_tempo)             p.set('max_tempo',     String(params.max_tempo))
  p.set('limit', String(Math.min(params.limit ?? 20, 100)))

  try {
    const data = await spotifyFetch<{ tracks: SpotifyTrack[] }>(`/recommendations?${p}`)
    return data.tracks ?? []
  } catch (err) {
    // Fallback si /recommendations est indisponible : search par genre
    console.warn('Recommendations endpoint failed, falling back to search:', err)
    const genre = params.seed_genres?.[0] ?? 'pop'
    return searchTracks(`genre:${genre}`, 20)
  }
}

// ── Playlists ─────────────────────────────────────────────────────────────────

export async function getUserPlaylists(limit = 50): Promise<SpotifyPlaylist[]> {
  const data = await spotifyFetch<{ items: SpotifyPlaylist[] }>(
    `/me/playlists?limit=${limit}`
  )
  return (data.items ?? []).filter(Boolean)
}

/**
 * Récupère une playlist complète avec ses morceaux.
 * Compatible avec les deux formats (ancien: tracks, nouveau: items)
 */
export async function getPlaylist(playlistId: string): Promise<SpotifyPlaylistFull> {
  // Essaie d'abord le nouvel endpoint /items
  try {
    return await spotifyFetch<SpotifyPlaylistFull>(
      `/playlists/${playlistId}?fields=id,name,description,images,items(total,items(item(id,name,uri,artists,album,preview_url))),owner,public`
    )
  } catch {
    // Fallback sur l'ancien format /tracks
    return spotifyFetch<SpotifyPlaylistFull>(
      `/playlists/${playlistId}?fields=id,name,description,images,tracks(total,items(track(id,name,uri,artists,album,preview_url))),owner,public`
    )
  }
}

/**
 * Extrait les tracks d'une playlist quelle que soit la version de l'API
 */
export function extractPlaylistTracks(playlist: SpotifyPlaylistFull): SpotifyTrack[] {
  // Nouveau format (items.items[].item)
  if (playlist.items?.items) {
    return playlist.items.items
      .map(i => i.item)
      .filter((t): t is SpotifyTrack => !!t?.id)
  }
  // Ancien format (tracks.items[].track)
  if (playlist.tracks?.items) {
    return playlist.tracks.items
      .map(i => i.track)
      .filter((t): t is SpotifyTrack => !!t?.id)
  }
  return []
}

/**
 * Retourne le total de morceaux d'une playlist (compatible les deux formats)
 */
export function getPlaylistTotal(playlist: SpotifyPlaylist): number {
  return playlist.items?.total ?? playlist.tracks?.total ?? 0
}

/**
 * Crée une playlist sur le compte de l'utilisateur
 * Nouvelle API : POST /me/playlists (plus besoin du userId dans l'URL)
 */
export async function createPlaylist(
  _userId: string,  // gardé pour compatibilité de signature mais non utilisé
  name: string,
  description = '',
  isPublic = false
): Promise<SpotifyPlaylist> {
  return spotifyFetch<SpotifyPlaylist>(`/me/playlists`, {
    method: 'POST',
    body: JSON.stringify({ name, description, public: isPublic }),
  })
}

/**
 * Ajoute des morceaux à une playlist
 * Nouvelle API : /playlists/{id}/items (ex /tracks)
 */
export async function addTracksToPlaylist(
  playlistId: string,
  uris: string[]
): Promise<void> {
  for (let i = 0; i < uris.length; i += 100) {
    await spotifyFetch(`/playlists/${playlistId}/items`, {
      method: 'POST',
      body: JSON.stringify({ uris: uris.slice(i, i + 100) }),
    })
  }
}

// ── Discovery helpers ─────────────────────────────────────────────────────────

function dedupeTracks(tracks: SpotifyTrack[]): SpotifyTrack[] {
  const seen = new Set<string>()
  return tracks.filter(track => {
    if (!track?.id || seen.has(track.id)) return false
    seen.add(track.id)
    return true
  })
}

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function buildCreatorQueries(params: {
  moment: string | null
  energy: string | null
  preference: string | null
  exclusions: string[]
  seedArtists: string[]
}, artistNames: string[], genres: string[]): string[] {
  const queries = new Set<string>()
  const genreTerms = genres.slice(0, 4)
  const artistTerms = artistNames.slice(0, 4)

  const moodByMoment: Record<string, string[]> = {
    chill: ['chill', 'ambient', 'indie', 'dream pop', 'downtempo'],
    voiture: ['road trip', 'indie rock', 'alt pop', 'electropop'],
    sport: ['workout', 'dance', 'electronic', 'hip hop', 'house'],
    focus: ['focus', 'instrumental', 'lofi', 'neo classical', 'jazz'],
    soiree: ['party', 'dance', 'house', 'afrobeats', 'pop'],
  }
  const energyByLevel: Record<string, string[]> = {
    faible: ['soft', 'calm', 'acoustic'],
    moyen: ['groove', 'indie pop', 'nu disco'],
    eleve: ['energetic', 'dance', 'electro', 'hyperpop'],
  }

  for (const term of moodByMoment[params.moment ?? ''] ?? []) queries.add(term)
  for (const term of energyByLevel[params.energy ?? ''] ?? []) queries.add(term)
  for (const genre of genreTerms) queries.add(`genre:"${genre}"`)

  if (params.preference === 'proche') {
    for (const artist of artistTerms.slice(0, 2)) queries.add(`artist:"${artist}"`)
  } else if (params.preference === 'mix') {
    for (const genre of genreTerms.slice(0, 2)) queries.add(`${genre} mix`)
    for (const artist of artistTerms.slice(0, 2)) queries.add(`similar to ${artist}`)
  } else if (params.preference === 'audacieux') {
    for (const genre of genreTerms.slice(0, 2)) queries.add(`${genre} underground`)
    queries.add('emerging artist')
    queries.add('discover weekly style')
  }

  const exclusions = params.exclusions.map(normalize)
  if (exclusions.includes('trop triste')) queries.add('upbeat')
  if (exclusions.includes('trop lent')) queries.add('energetic')
  if (exclusions.includes('trop agressif')) queries.add('melodic')
  if (exclusions.includes('trop commercial')) queries.add('indie')

  return Array.from(queries).filter(Boolean).slice(0, 8)
}

/**
 * Outil 1 — Génère des recommandations basées sur le questionnaire
 */
export async function getPlaylistCreatorTracks(params: {
  moment: string | null
  energy: string | null
  preference: string | null
  exclusions: string[]
  seedTracks: string[]
  seedArtists: string[]
}): Promise<TrackItem[]> {
  const energyMap: Record<string, number> = {
    faible: 0.25, moyen: 0.55, eleve: 0.85,
  }
  const valenceMap: Record<string, number> = {
    chill: 0.4, voiture: 0.6, sport: 0.75, focus: 0.35, soiree: 0.7,
  }
  const tempoMap: Record<string, { min?: number; max?: number }> = {
    chill:   { max: 100 },
    voiture: { min: 100, max: 140 },
    sport:   { min: 130 },
    focus:   { max: 110 },
    soiree:  { min: 110 },
  }

  const energy = params.energy ? (energyMap[params.energy] ?? 0.5) : 0.5
  const valence = params.moment ? (valenceMap[params.moment] ?? 0.5) : 0.5
  const tempo = params.moment ? (tempoMap[params.moment] ?? {}) : {}

  let finalEnergy = energy
  if (params.exclusions.includes('trop agressif')) finalEnergy = Math.min(finalEnergy, 0.6)
  if (params.exclusions.includes('trop lent')) finalEnergy = Math.max(finalEnergy, 0.4)

  const topArtists = await Promise.all(params.seedArtists.slice(0, 5).map(id => getArtist(id).catch(() => null)))
  const artistObjects = topArtists.filter((artist): artist is SpotifyArtist => !!artist)
  const artistNames = artistObjects.map(a => a.name)
  const genres = [...new Set(artistObjects.flatMap(a => a.genres ?? []))]

  const recommendationPromise = getRecommendations({
    seed_tracks:  params.seedTracks.slice(0, 3),
    seed_artists: params.seedArtists.slice(0, 2),
    seed_genres: genres.slice(0, 2),
    target_energy: finalEnergy,
    target_valence: valence,
    ...tempo,
    limit: 60,
  }).catch(() => [] as SpotifyTrack[])

  const searchQueries = buildCreatorQueries(params, artistNames, genres)
  const searchResults = await Promise.all(
    searchQueries.map(query => searchTracksPaginated(query, 10).catch(() => [] as SpotifyTrack[]))
  )

  const recommended = await recommendationPromise
  const combined = dedupeTracks([
    ...recommended,
    ...searchResults.flat(),
  ])

  const blockedArtistNames = new Set(artistNames.map(normalize))
  const filtered = combined.filter(track => {
    const artistNamesOfTrack = track.artists.map(a => normalize(a.name))
    const sameAsTopArtist = artistNamesOfTrack.some(name => blockedArtistNames.has(name))

    if (params.preference === 'audacieux' && sameAsTopArtist) return false
    return true
  })

  let ordered = filtered
  if (params.preference === 'proche') {
    ordered = [
      ...filtered.filter(track => track.artists.some(a => blockedArtistNames.has(normalize(a.name)))),
      ...filtered.filter(track => !track.artists.some(a => blockedArtistNames.has(normalize(a.name)))),
    ]
  } else if (params.preference === 'audacieux') {
    ordered = [
      ...filtered.filter(track => !track.artists.some(a => blockedArtistNames.has(normalize(a.name)))),
      ...filtered.filter(track => track.artists.some(a => blockedArtistNames.has(normalize(a.name)))),
    ]
  }

  return dedupeTracks(ordered).map(t => ({ ...t, selected: false }))
}

/**
 * Outil 2 — Artistes similaires à vos favoris (mode standard)
 */
export async function discoverNewArtists(
  topArtists: SpotifyArtist[],
  knownArtistIds: Set<string>,
  limit = 9
): Promise<SpotifyArtist[]> {
  const candidates = new Map<string, SpotifyArtist>()

  const queries = topArtists.slice(0, 5).flatMap(artist => {
    const genres = (artist.genres ?? []).slice(0, 2)
    const q: string[] = []
    if (genres.length > 0) {
      q.push(...genres.map(genre => `genre:"${genre}"`))
      q.push(`${artist.name} ${genres[0]}`)
    } else {
      q.push(`artist:"${artist.name}"`)
      q.push(artist.name)
    }
    return q
  }).filter(Boolean).slice(0, 8)

  const results = await Promise.all(
    queries.map(query => searchArtistsPaginated(query, 12).catch(() => [] as SpotifyArtist[]))
  )

  for (const related of results.flat()) {
    if (!knownArtistIds.has(related.id) && !candidates.has(related.id) && (related.images?.length ?? 0) > 0) {
      candidates.set(related.id, related)
    }
  }

  return Array.from(candidates.values()).slice(0, limit)
}

/**
 * Outil 2 — Hidden Gems : artistes similaires mais avec peu d'abonnés
 * Stratégie : search avec les genres des top artistes, filtrer les peu connus
 */
export async function discoverHiddenGems(
  topArtists: SpotifyArtist[],
  knownArtistIds: Set<string>,
  limit = 9
): Promise<SpotifyArtist[]> {
  const genres = [...new Set(topArtists.flatMap(a => a.genres))].slice(0, 6)
  if (genres.length === 0) return []

  const allCandidates: SpotifyArtist[] = []

  // Cherche des artistes par genre (2 genres en parallèle max pour limiter les appels)
  const genreQueries = genres.slice(0, 4).map(genre =>
    searchArtistsPaginated(`genre:"${genre}"`, 20).catch(() => [] as SpotifyArtist[])
  )
  const results = await Promise.all(genreQueries)

  for (const batch of results) {
    for (const artist of batch) {
      if (!knownArtistIds.has(artist.id) && (artist.images?.length ?? 0) > 0) {
        allCandidates.push(artist)
      }
    }
  }

  // Déduplique
  const seen = new Set<string>()
  const unique = allCandidates.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  // Les "hidden gems" sont ceux sans followers renseignés (nouveaux artistes)
  // ou avec peu d'abonnés — on les prend dans les dernières positions de search
  // (Spotify retourne les plus populaires en premier, on prend la fin)
  const gems = unique.reverse().slice(0, limit * 2)

  // Mélange pour varier les résultats
  for (let i = gems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [gems[i], gems[j]] = [gems[j], gems[i]]
  }

  return gems.slice(0, limit)
}

/**
 * Outil 2 — Artistes internationaux : mêmes genres mais d'autres pays
 * Stratégie : cherche des artistes avec les mêmes genres + tags géographiques
 */
export async function discoverInternationalArtists(
  topArtists: SpotifyArtist[],
  knownArtistIds: Set<string>,
  targetCountries: string[] = ['brazil', 'japan', 'nigeria', 'sweden', 'colombia', 'south korea', 'senegal', 'uk'],
  limit = 9
): Promise<SpotifyArtist[]> {
  const genres = [...new Set(topArtists.flatMap(a => a.genres))].slice(0, 3)
  if (genres.length === 0) return []

  const allCandidates: SpotifyArtist[] = []

  // Combine genres + pays pour trouver des artistes internationaux
  const queries: Promise<SpotifyArtist[]>[] = []
  for (const country of targetCountries.slice(0, 4)) {
    for (const genre of genres.slice(0, 2)) {
      queries.push(
        searchArtists(`${genre} ${country}`, 10).catch(() => [] as SpotifyArtist[])
      )
    }
  }

  const results = await Promise.all(queries)
  for (const batch of results) {
    for (const artist of batch) {
      if (!knownArtistIds.has(artist.id) && (artist.images?.length ?? 0) > 0) {
        allCandidates.push(artist)
      }
    }
  }

  // Déduplique
  const seen = new Set<string>()
  const unique = allCandidates.filter(a => {
    if (seen.has(a.id)) return false
    seen.add(a.id)
    return true
  })

  // Mélange
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unique[i], unique[j]] = [unique[j], unique[i]]
  }

  return unique.slice(0, limit)
}
