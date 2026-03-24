/**
 * PlaylistDoctorPage.tsx
 * Outil 3 : Analyse d'une playlist et suggestions
 */

import { useState, useEffect } from 'react'
import {
  getUserPlaylists, getPlaylist, getRecommendations, extractPlaylistTracks, getPlaylistTotal, searchTracksPaginated
} from '@/services/spotifyApi'
import { TrackCard } from '@/components/TrackCard'
import { SelectionBar } from '@/components/SelectionBar'
import { Skeleton, Badge, ScoreBar, EmptyState } from '@/components/ui'
import type { SpotifyPlaylist, TrackItem, PlaylistDiagnosis } from '@/types/spotify'

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, Math.round(value)))
}

function dedupeTracks(tracks: TrackItem[]): TrackItem[] {
  const seen = new Set<string>()
  return tracks.filter(track => {
    if (!track?.id || seen.has(track.id)) return false
    seen.add(track.id)
    return true
  })
}

function analyzeTracks(tracks: TrackItem[]): PlaylistDiagnosis {
  const artistNames = tracks.flatMap(t => t.artists.map(a => a.name))
  const artistCount: Record<string, number> = {}
  artistNames.forEach(a => { artistCount[a] = (artistCount[a] || 0) + 1 })

  const uniqueArtists = new Set(artistNames).size
  const totalArtistSlots = artistNames.length || 1
  const repeatedArtistSlots = Object.values(artistCount).reduce((acc, count) => acc + Math.max(0, count - 1), 0)
  const repetitionRatio = repeatedArtistSlots / totalArtistSlots
  const uniqueArtistRatio = uniqueArtists / Math.max(1, tracks.length)
  const dominantArtistShare = Math.max(...Object.values(artistCount)) / Math.max(1, tracks.length)

  const diversity = clamp((uniqueArtistRatio * 55) + ((1 - dominantArtistShare) * 30) + ((1 - repetitionRatio) * 15), 15, 98)
  const coherence = clamp(25 + (repetitionRatio * 45) + (dominantArtistShare * 30), 10, 95)

  const topArtists = Object.entries(artistCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([a]) => a)

  const mood = coherence >= 75
    ? 'très cohérente'
    : coherence >= 55
      ? 'équilibrée'
      : diversity >= 70
        ? 'exploratoire'
        : 'hybride'

  return {
    dominantMood: mood,
    genres: [],
    topArtists,
    coherenceScore: coherence,
    diversityScore: diversity,
    description: `Playlist ${mood} avec ${tracks.length} morceaux, ${uniqueArtists} artistes uniques et ${topArtists[0] ? `une dominante ${topArtists[0]}` : 'peu de répétition marquée'}.`,
  }
}

export function PlaylistDoctorPage() {
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [chosen, setChosen] = useState<SpotifyPlaylist | null>(null)
  const [diagnosis, setDiagnosis] = useState<PlaylistDiagnosis | null>(null)
  const [suggestions, setSuggestions] = useState<TrackItem[]>([])
  const [selected, setSelected] = useState<TrackItem[]>([])
  const [loadingPlaylists, setLoadingPlaylists] = useState(true)
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'pick' | 'results'>('pick')

  useEffect(() => {
    getUserPlaylists(50)
      .then(setPlaylists)
      .catch(err => setError(err.message))
      .finally(() => setLoadingPlaylists(false))
  }, [])

  async function analyzePlaylist(playlist: SpotifyPlaylist) {
    setChosen(playlist)
    setLoadingAnalysis(true)
    setError(null)
    try {
      const full = await getPlaylist(playlist.id)
      const tracks: TrackItem[] = extractPlaylistTracks(full).map(t => ({ ...t, selected: false }))

      if (tracks.length === 0) {
        setError('Cette playlist est vide.')
        setLoadingAnalysis(false)
        return
      }

      const diag = analyzeTracks(tracks)
      setDiagnosis(diag)

      const seedTrackIds = tracks.slice(0, 5).map(t => t.id)
      const seedArtistIds = [...new Set(tracks.flatMap(t => t.artists.map(a => a.id)))].slice(0, 5)
      const seedArtistNames = [...new Set(tracks.flatMap(t => t.artists.map(a => a.name)))].slice(0, 4)
      const searchQueries = seedArtistNames.map(name => `artist:"${name}"`)

      const [recs, searched] = await Promise.all([
        getRecommendations({ seed_tracks: seedTrackIds, seed_artists: seedArtistIds, limit: 30 }).catch(() => []),
        Promise.all(searchQueries.map(query => searchTracksPaginated(query, 8).catch(() => []))).then(items => items.flat()),
      ])

      const existingIds = new Set(tracks.map(t => t.id))
      const filtered = dedupeTracks(
        [...recs, ...searched]
          .filter(t => !existingIds.has(t.id))
          .map(t => ({ ...t, selected: false }))
      )

      const artistFocus = new Set(seedArtistIds)
      const ordered = [
        ...filtered.filter(t => t.artists.some(a => artistFocus.has(a.id))),
        ...filtered.filter(t => !t.artists.some(a => artistFocus.has(a.id))),
      ]

      setSuggestions(dedupeTracks(ordered).slice(0, 20))
      setSelected([])
      setStep('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur d’analyse')
    } finally {
      setLoadingAnalysis(false)
    }
  }

  function toggleSelect(track: TrackItem) {
    setSuggestions(prev => prev.map(t => t.id === track.id ? { ...t, selected: !t.selected } : t))
    setSelected(prev => {
      const exists = prev.find(t => t.id === track.id)
      return exists ? prev.filter(t => t.id !== track.id) : [...prev, { ...track, selected: true }]
    })
  }

  function ignoreTrack(id: string) {
    setSuggestions(prev => prev.filter(t => t.id !== id))
    setSelected(prev => prev.filter(t => t.id !== id))
  }

  function removeSelected(id: string) {
    setSelected(prev => prev.filter(t => t.id !== id))
    setSuggestions(prev => prev.map(t => t.id === id ? { ...t, selected: false } : t))
  }

  function reset() {
    setChosen(null)
    setDiagnosis(null)
    setSuggestions([])
    setSelected([])
    setStep('pick')
  }

  return (
    <div className="page-container py-10">
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">⊕</span>
          <h1 className="font-display font-extrabold text-3xl text-white">Playlist Doctor</h1>
        </div>
        <p className="text-[--text-secondary]">Analysez une playlist et recevez des suggestions pour l’enrichir.</p>
      </div>

      {step === 'pick' ? (
        <div className="animate-slide-up">
          <h2 className="font-display font-semibold text-white mb-6 text-lg">Choisissez une playlist</h2>

          {loadingPlaylists ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="card p-4 flex items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <EmptyState icon="⚠️" title="Erreur" description={error} />
          ) : playlists.length === 0 ? (
            <EmptyState icon="🎵" title="Aucune playlist" description="Créez d’abord une playlist sur Spotify." />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {playlists.map((pl, i) => (
                <button
                  key={pl.id}
                  onClick={() => analyzePlaylist(pl)}
                  disabled={loadingAnalysis}
                  className="card p-4 flex items-center gap-3 text-left hover:border-accent/30 transition-all duration-200 animate-slide-up disabled:opacity-50"
                  style={{ animationDelay: `${i * 0.03}s` }}
                >
                  {pl.images?.[0]?.url
                    ? <img src={pl.images[0].url} alt={pl.name} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                    : <div className="w-14 h-14 rounded-lg bg-bg-overlay flex items-center justify-center text-xl shrink-0">🎵</div>
                  }
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-white text-sm truncate">{pl.name}</p>
                    <p className="text-[--text-muted] text-xs mt-0.5">{getPlaylistTotal(pl)} morceaux</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {loadingAnalysis && (
            <div className="flex items-center gap-3 mt-8 text-[--text-secondary]">
              <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              Analyse de "{chosen?.name}" en cours…
            </div>
          )}
        </div>
      ) : (
        <div className="animate-fade-in space-y-10">
          <div className="flex items-center gap-4">
            <button onClick={reset} className="btn-ghost text-sm">← Changer</button>
            {chosen?.images?.[0]?.url && (
              <img src={chosen.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <span className="font-display font-semibold text-white">{chosen?.name}</span>
          </div>

          {diagnosis && (
            <div className="card p-6 space-y-5">
              <h2 className="font-display font-bold text-white text-lg flex items-center gap-2">🩺 Diagnostic</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-[--text-muted] text-xs mb-1">Ambiance dominante</p>
                    <Badge variant="accent">{diagnosis.dominantMood}</Badge>
                  </div>
                  <div>
                    <p className="text-[--text-muted] text-xs mb-2">Artistes principaux</p>
                    <div className="flex flex-wrap gap-1.5">
                      {diagnosis.topArtists.map(a => <Badge key={a}>{a}</Badge>)}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <ScoreBar label="Cohérence" value={diagnosis.coherenceScore} />
                  <ScoreBar label="Diversité" value={diagnosis.diversityScore} />
                </div>
              </div>
              <p className="text-[--text-secondary] text-sm border-t border-white/[0.06] pt-4">💡 {diagnosis.description}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
              <h2 className="font-display font-bold text-xl text-white">{suggestions.length} suggestions</h2>
              <p className="text-[--text-secondary] text-sm">Cliquez pour sélectionner, ✕ pour ignorer</p>
            </div>

            {suggestions.length === 0 ? (
              <EmptyState icon="✓" title="Tout a été traité !" description="Vous avez accepté ou ignoré toutes les suggestions." />
            ) : (
              <div className="space-y-3 pb-32">
                {suggestions.map(track => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    onSelect={toggleSelect}
                    onIgnore={ignoreTrack}
                    showIgnore
                    compact
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <SelectionBar
        selected={selected}
        onRemove={removeSelected}
        onClear={() => {
          setSelected([])
          setSuggestions(prev => prev.map(t => ({ ...t, selected: false })))
        }}
        targetPlaylist={chosen}
      />
    </div>
  )
}
