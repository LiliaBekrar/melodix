/**
 * ArtistDiscoveryPage.tsx
 * Outil 2 : Découverte de nouveaux artistes
 * Trois modes : Similaires / Hidden Gems / International
 */

import { useState, useEffect, useCallback } from 'react'
import {
  getTopArtists, getRecentlyPlayed,
  discoverNewArtists, discoverHiddenGems, discoverInternationalArtists,
  getArtistTopTracks,
} from '@/services/spotifyApi'
import { TrackCard } from '@/components/TrackCard'
import { SelectionBar } from '@/components/SelectionBar'
import { Skeleton, Badge, EmptyState, Button } from '@/components/ui'
import type { SpotifyArtist, TrackItem } from '@/types/spotify'

interface ArtistWithTracks {
  artist: SpotifyArtist
  tracks: TrackItem[]
  loading: boolean
}

type DiscoveryMode = 'similar' | 'gems' | 'international'

const MODES: { id: DiscoveryMode; icon: string; label: string; desc: string; color: string }[] = [
  {
    id: 'similar',
    icon: '◎',
    label: 'Similaires',
    desc: 'Artistes proches de vos favoris',
    color: 'accent',
  },
  {
    id: 'gems',
    icon: '💎',
    label: 'Hidden Gems',
    desc: 'Pépites cachées, peu d\'auditeurs',
    color: 'yellow',
  },
  {
    id: 'international',
    icon: '🌍',
    label: 'International',
    desc: 'Mêmes sons, autres pays',
    color: 'blue',
  },
]

const COUNTRY_OPTIONS = [
  { value: 'brazil', label: '🇧🇷 Brésil' },
  { value: 'japan', label: '🇯🇵 Japon' },
  { value: 'nigeria', label: '🇳🇬 Nigeria' },
  { value: 'sweden', label: '🇸🇪 Suède' },
  { value: 'colombia', label: '🇨🇴 Colombie' },
  { value: 'south korea', label: '🇰🇷 Corée du Sud' },
  { value: 'senegal', label: '🇸🇳 Sénégal' },
  { value: 'uk', label: '🇬🇧 Royaume-Uni' },
  { value: 'mexico', label: '🇲🇽 Mexique' },
  { value: 'ghana', label: '🇬🇭 Ghana' },
]

export function ArtistDiscoveryPage() {
  const [mode, setMode] = useState<DiscoveryMode>('similar')
  const [artistsData, setArtistsData] = useState<Record<DiscoveryMode, ArtistWithTracks[]>>({
    similar: [], gems: [], international: [],
  })
  const [loadingState, setLoadingState] = useState<Record<DiscoveryMode, boolean>>({
    similar: false, gems: false, international: false,
  })
  const [errorState, setErrorState] = useState<Record<DiscoveryMode, string | null>>({
    similar: null, gems: null, international: null,
  })
  const [selected, setSelected] = useState<TrackItem[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  const [selectedCountries, setSelectedCountries] = useState<string[]>(
    ['brazil', 'japan', 'nigeria', 'sweden']
  )
  const [showCountryPicker, setShowCountryPicker] = useState(false)

  // Charge les données pour le mode courant si pas encore chargé
  useEffect(() => {
    if (artistsData[mode].length === 0 && !loadingState[mode]) {
      loadMode(mode)
    }
  }, [mode])

  async function loadMode(m: DiscoveryMode) {
    setLoadingState(prev => ({ ...prev, [m]: true }))
    setErrorState(prev => ({ ...prev, [m]: null }))
    try {
      const [topArtists, recent] = await Promise.all([
        getTopArtists('medium_term', 10),
        getRecentlyPlayed(50),
      ])
      const knownIds = new Set([
        ...topArtists.map(a => a.id),
        ...recent.flatMap(t => t.artists.map(a => a.id)),
      ])

      let discovered: SpotifyArtist[] = []
      if (m === 'similar') {
        discovered = await discoverNewArtists(topArtists, knownIds, 9)
      } else if (m === 'gems') {
        discovered = await discoverHiddenGems(topArtists, knownIds, 9)
      } else {
        discovered = await discoverInternationalArtists(topArtists, knownIds, selectedCountries, 9)
      }

      setArtistsData(prev => ({
        ...prev,
        [m]: discovered.map(artist => ({ artist, tracks: [], loading: false })),
      }))
    } catch (err) {
      setErrorState(prev => ({
        ...prev,
        [m]: err instanceof Error ? err.message : 'Erreur lors du chargement',
      }))
    } finally {
      setLoadingState(prev => ({ ...prev, [m]: false }))
    }
  }

  function refreshMode() {
    setArtistsData(prev => ({ ...prev, [mode]: [] }))
    loadMode(mode)
  }

  async function expandArtist(artistId: string, artistName: string) {
    if (expanded === artistId) { setExpanded(null); return }
    setExpanded(artistId)

    const entry = artistsData[mode].find(a => a.artist.id === artistId)
    if (!entry || entry.tracks.length > 0) return

    setArtistsData(prev => ({
      ...prev,
      [mode]: prev[mode].map(a => a.artist.id === artistId ? { ...a, loading: true } : a),
    }))

    try {
      const tracks = await getArtistTopTracks(artistId, artistName)
      setArtistsData(prev => ({
        ...prev,
        [mode]: prev[mode].map(a =>
          a.artist.id === artistId
            ? { ...a, tracks: tracks.slice(0, 3).map(t => ({ ...t, selected: false })), loading: false }
            : a
        ),
      }))
    } catch {
      setArtistsData(prev => ({
        ...prev,
        [mode]: prev[mode].map(a => a.artist.id === artistId ? { ...a, loading: false } : a),
      }))
    }
  }

  function toggleSelect(track: TrackItem) {
    setArtistsData(prev => {
      const updated = { ...prev }
      for (const m of Object.keys(updated) as DiscoveryMode[]) {
        updated[m] = updated[m].map(a => ({
          ...a,
          tracks: a.tracks.map(t => t.id === track.id ? { ...t, selected: !t.selected } : t),
        }))
      }
      return updated
    })
    setSelected(prev => {
      const exists = prev.find(t => t.id === track.id)
      return exists ? prev.filter(t => t.id !== track.id) : [...prev, { ...track, selected: true }]
    })
  }

  function removeSelected(id: string) {
    setSelected(prev => prev.filter(t => t.id !== id))
    setArtistsData(prev => {
      const updated = { ...prev }
      for (const m of Object.keys(updated) as DiscoveryMode[]) {
        updated[m] = updated[m].map(a => ({
          ...a,
          tracks: a.tracks.map(t => t.id === id ? { ...t, selected: false } : t),
        }))
      }
      return updated
    })
  }

  const currentArtists = artistsData[mode]
  const isLoading = loadingState[mode]
  const error = errorState[mode]
  const currentMode = MODES.find(m => m.id === mode)!

  return (
    <div className="page-container py-10">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">◎</span>
          <h1 className="font-display font-extrabold text-3xl text-white">Découverte d'Artistes</h1>
        </div>
        <p className="text-[--text-secondary]">Explorez de nouveaux artistes selon votre profil musical.</p>
      </div>

      {/* Mode tabs */}
      <div className="flex gap-3 mb-8 flex-wrap animate-slide-up">
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-sm font-medium transition-all duration-200 ${
              mode === m.id
                ? m.id === 'gems'
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : m.id === 'international'
                    ? 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    : 'bg-accent/10 border-accent/30 text-accent'
                : 'bg-bg-raised border-white/10 text-[--text-secondary] hover:border-white/20 hover:text-white'
            }`}
          >
            <span className="text-base">{m.icon}</span>
            <div className="text-left">
              <div className="font-semibold">{m.label}</div>
              <div className="text-xs opacity-70 hidden sm:block">{m.desc}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Country picker (mode international seulement) */}
      {mode === 'international' && (
        <div className="mb-6 card p-4 animate-scale-in">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-white">Régions à explorer</span>
            <button
              onClick={() => { setShowCountryPicker(!showCountryPicker) }}
              className="text-xs text-[--text-secondary] hover:text-white"
            >
              {showCountryPicker ? 'Fermer' : 'Modifier ▾'}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {showCountryPicker ? (
              COUNTRY_OPTIONS.map(c => (
                <button
                  key={c.value}
                  onClick={() => {
                    setSelectedCountries(prev =>
                      prev.includes(c.value)
                        ? prev.filter(x => x !== c.value)
                        : [...prev, c.value]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    selectedCountries.includes(c.value)
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      : 'bg-bg-overlay border-white/10 text-[--text-muted]'
                  }`}
                >
                  {c.label}
                </button>
              ))
            ) : (
              selectedCountries.map(c => (
                <Badge key={c} variant="info">
                  {COUNTRY_OPTIONS.find(o => o.value === c)?.label ?? c}
                </Badge>
              ))
            )}
          </div>
          {showCountryPicker && (
            <button
              onClick={() => { setShowCountryPicker(false); refreshMode() }}
              className="mt-3 btn-primary text-xs px-4 py-1.5"
            >
              Appliquer
            </button>
          )}
        </div>
      )}

      {/* Mode description banner */}
      {mode === 'gems' && (
        <div className="mb-6 flex items-start gap-3 bg-yellow-500/5 border border-yellow-500/15 rounded-2xl p-4 animate-fade-in">
          <span className="text-2xl shrink-0">💎</span>
          <div>
            <p className="text-yellow-300 font-medium text-sm">Hidden Gems</p>
            <p className="text-[--text-secondary] text-xs mt-0.5">
              Artistes qui partagent vos genres musicaux mais restent sous le radar — peu d'auditeurs, beaucoup de talent.
            </p>
          </div>
        </div>
      )}
      {mode === 'international' && (
        <div className="mb-6 flex items-start gap-3 bg-blue-500/5 border border-blue-500/15 rounded-2xl p-4 animate-fade-in">
          <span className="text-2xl shrink-0">🌍</span>
          <div>
            <p className="text-blue-300 font-medium text-sm">Sons du monde</p>
            <p className="text-[--text-secondary] text-xs mt-0.5">
              Vos genres favoris interprétés par des artistes d'autres cultures. Même sensibilité, autre perspective.
            </p>
          </div>
        </div>
      )}

      {/* Refresh + count */}
      {currentArtists.length > 0 && (
        <div className="flex items-center justify-between mb-6">
          <p className="text-[--text-secondary] text-sm">
            <span className="text-white font-semibold">{currentArtists.length}</span> artistes trouvés
          </p>
          <button onClick={refreshMode} className="btn-ghost text-xs gap-1.5">
            ↺ Rafraîchir
          </button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 space-y-4">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon="⚠️"
          title="Erreur de chargement"
          description={error}
          action={<Button onClick={refreshMode}>Réessayer</Button>}
        />
      ) : currentArtists.length === 0 ? (
        <EmptyState
          icon={currentMode.icon}
          title="Aucun artiste trouvé"
          description="Écoutez plus de musique sur Spotify pour affiner les suggestions."
          action={<Button onClick={refreshMode}>Réessayer</Button>}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-32">
          {currentArtists.map(({ artist, tracks, loading: tracksLoading }, idx) => (
            <ArtistCard
              key={artist.id}
              artist={artist}
              tracks={tracks}
              tracksLoading={tracksLoading}
              isExpanded={expanded === artist.id}
              mode={mode}
              idx={idx}
              onExpand={() => expandArtist(artist.id, artist.name)}
              onSelect={toggleSelect}
            />
          ))}
        </div>
      )}

      <SelectionBar
        selected={selected}
        onRemove={removeSelected}
        onClear={() => {
          setSelected([])
          setArtistsData(prev => {
            const updated = { ...prev }
            for (const m of Object.keys(updated) as DiscoveryMode[]) {
              updated[m] = updated[m].map(a => ({
                ...a,
                tracks: a.tracks.map(t => ({ ...t, selected: false })),
              }))
            }
            return updated
          })
        }}
      />
    </div>
  )
}

// ── ArtistCard ─────────────────────────────────────────────────────────────────

function ArtistCard({ artist, tracks, tracksLoading, isExpanded, mode, idx, onExpand, onSelect }: {
  artist: SpotifyArtist
  tracks: TrackItem[]
  tracksLoading: boolean
  isExpanded: boolean
  mode: DiscoveryMode
  idx: number
  onExpand: () => void
  onSelect: (t: TrackItem) => void
}) {
  const accentClass = mode === 'gems'
    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : mode === 'international'
      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      : 'bg-accent/10 text-accent border-accent/20'

  return (
    <div
      className="card overflow-hidden animate-slide-up"
      style={{ animationDelay: `${idx * 0.06}s` }}
    >
      {/* Banner + Avatar */}
      <div className="relative h-28 overflow-hidden">
        {artist.images?.[0]?.url
          ? <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover object-top" />
          : <div className="w-full h-full bg-bg-overlay flex items-center justify-center text-3xl">🎤</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-bg-surface via-bg-surface/40 to-transparent" />

        {/* Mode badge */}
        <div className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded-full border ${accentClass}`}>
          {mode === 'gems' ? '💎 Gem' : mode === 'international' ? '🌍 Intl' : '◎ Similar'}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 pt-0 relative -mt-6">
        <div className="flex items-end gap-3 mb-3">
          {artist.images?.[0]?.url && (
            <img
              src={artist.images[0].url}
              alt=""
              className="w-14 h-14 rounded-full border-2 border-bg-surface object-cover shrink-0"
            />
          )}
          <div className="min-w-0 pb-1">
            <h3 className="font-display font-bold text-white text-base truncate">{artist.name}</h3>
            <a
              href={artist.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[--text-muted] hover:text-accent transition-colors"
              onClick={e => e.stopPropagation()}
            >
              Ouvrir sur Spotify ↗
            </a>
          </div>
        </div>

        {/* Genres */}
        {(artist.genres?.length ?? 0) > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(artist.genres ?? []).slice(0, 3).map(g => <Badge key={g}>{g}</Badge>)}
          </div>
        )}

        {/* Expand button */}
        <button
          onClick={onExpand}
          className={`w-full py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
            isExpanded
              ? `${accentClass}`
              : 'bg-bg-raised border-white/10 text-[--text-secondary] hover:border-white/20 hover:text-white'
          }`}
        >
          {isExpanded ? '▲ Masquer les titres' : '▼ Voir les titres'}
        </button>
      </div>

      {/* Tracks */}
      {isExpanded && (
        <div className="px-3 pb-4 space-y-2 animate-slide-up border-t border-white/[0.06] pt-3">
          {tracksLoading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-2.5 w-1/2" />
                </div>
              </div>
            ))
          ) : tracks.length === 0 ? (
            <p className="text-[--text-muted] text-xs text-center py-3">Aucun titre disponible</p>
          ) : (
            tracks.map(track => (
              <TrackCard key={track.id} track={track} onSelect={onSelect} compact />
            ))
          )}
        </div>
      )}
    </div>
  )
}
