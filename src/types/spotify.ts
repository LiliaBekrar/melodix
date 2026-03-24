/**
 * Types TypeScript — compatibles avec l'API Spotify 2025/2026
 *
 * Champs supprimés par Spotify (ne plus utiliser) :
 *  - Track: popularity, available_markets, linked_from
 *  - Artist: popularity, followers
 *  - User: country, email, product, followers
 *  - Playlist: tracks → renommé en items
 */

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface SpotifyTokens {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
  scope: string
  expires_at: number
}

// ── Entités Spotify ───────────────────────────────────────────────────────────

export interface SpotifyImage {
  url: string
  width: number | null
  height: number | null
}

export interface SpotifyArtistSimple {
  id: string
  name: string
  uri: string
}

export interface SpotifyArtist {
  id: string
  name: string
  uri: string
  genres: string[]
  images?: SpotifyImage[] | null
  popularity?: number
  followers?: { total: number }
  external_urls: { spotify: string }
}

export interface SpotifyAlbum {
  id: string
  name: string
  images?: SpotifyImage[] | null
  release_date: string
  artists: SpotifyArtistSimple[]
}

export interface SpotifyTrack {
  id: string
  name: string
  uri: string
  duration_ms: number
  preview_url: string | null
  popularity?: number
  artists: SpotifyArtistSimple[]
  album: SpotifyAlbum
  external_urls: { spotify: string }
}

export interface SpotifyPlaylist {
  id: string
  name: string
  description: string | null
  images?: SpotifyImage[] | null
  items?: { total: number }
  tracks?: { total: number }
  owner: { display_name: string; id: string }
  public: boolean
  uri: string
  external_urls: { spotify: string }
}

export interface SpotifyPlaylistFull extends Omit<SpotifyPlaylist, 'items' | 'tracks'> {
  items?: {
    total: number
    items: Array<{ item: SpotifyTrack | null; added_at: string }>
  }
  tracks?: {
    total: number
    items: Array<{ track: SpotifyTrack | null; added_at: string }>
  }
}

export interface SpotifyUser {
  id: string
  display_name: string
  images?: SpotifyImage[] | null
  email?: string
  country?: string
  product?: string
  followers?: { total: number }
  external_urls: { spotify: string }
}

export interface SpotifySearchResult {
  artists?: { items: SpotifyArtist[] }
  tracks?: { items: SpotifyTrack[] }
}

// ── Types applicatifs ─────────────────────────────────────────────────────────

export interface TrackItem extends SpotifyTrack {
  selected?: boolean
}

export interface ArtistWithScore extends SpotifyArtist {
  relevanceScore: number
  discoverySource: 'related' | 'hidden_gem' | 'international'
  estimatedCountry?: string
}

export interface PlaylistDiagnosis {
  dominantMood: string
  genres: string[]
  topArtists: string[]
  coherenceScore: number
  diversityScore: number
  description: string
}

export interface PlayerState {
  trackId: string | null
  previewUrl: string | null
  isPlaying: boolean
  trackName: string
  artistName: string
  albumImage: string
}

export interface PlaylistCreatorAnswers {
  moment: 'chill' | 'voiture' | 'sport' | 'focus' | 'soiree' | null
  energy: 'faible' | 'moyen' | 'eleve' | null
  preference: 'proche' | 'mix' | 'audacieux' | null
  exclusions: string[]
}
