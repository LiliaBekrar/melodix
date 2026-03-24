/**
 * SelectionBar.tsx
 * Barre de sélection de morceaux + création / ajout à une playlist
 */

import { useEffect, useState } from 'react'
import type { TrackItem, SpotifyPlaylist } from '@/types/spotify'
import { useAuth } from '@/hooks/useAuth'
import { createPlaylist, addTracksToPlaylist, getUserPlaylists } from '@/services/spotifyApi'
import appConfig from '@/config/appConfig'
import { Button } from '@/components/ui'

interface SelectionBarProps {
  selected: TrackItem[]
  onRemove: (id: string) => void
  onClear: () => void
  targetPlaylist?: SpotifyPlaylist | null
}

export function SelectionBar({ selected, onRemove, onClear, targetPlaylist = null }: SelectionBarProps) {
  const { user } = useAuth()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([])
  const [playlistId, setPlaylistId] = useState<string>('')
  const [playlistLoading, setPlaylistLoading] = useState(false)

  useEffect(() => {
    if (!targetPlaylist) {
      setPlaylistLoading(true)
      getUserPlaylists(50)
        .then(items => {
          setPlaylists(items)
          if (!playlistId && items[0]?.id) setPlaylistId(items[0].id)
        })
        .catch(() => undefined)
        .finally(() => setPlaylistLoading(false))
    }
  }, [targetPlaylist, playlistId])

  if (selected.length === 0) return null

  async function handleCreate() {
    if (!user || !name.trim()) return
    setLoading(true)
    setError(null)
    try {
      const playlist = await createPlaylist(
        user.id,
        name.trim(),
        `Créée avec ${appConfig.appName} · ${selected.length} morceaux`,
        false
      )
      await addTracksToPlaylist(playlist.id, selected.map(t => t.uri))
      setSuccess(playlist.external_urls.spotify)
      onClear()
      setName('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddToPlaylist() {
    const destinationId = targetPlaylist?.id ?? playlistId
    if (!destinationId) return
    setLoading(true)
    setError(null)
    try {
      await addTracksToPlaylist(destinationId, selected.map(t => t.uri))
      const spotifyUrl = targetPlaylist?.external_urls.spotify ?? playlists.find(p => p.id === destinationId)?.external_urls.spotify ?? null
      setSuccess(spotifyUrl)
      onClear()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l’ajout à la playlist')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 animate-slide-up">
      <div className="backdrop-blur-xl border-t border-white/10" style={{ backgroundColor: "rgba(17, 22, 31, 0.98)" }}>
        <div className="page-container py-4">
          {success ? (
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <span className="text-accent text-xl">✓</span>
                <p className="text-white font-display font-semibold">Morceaux ajoutés avec succès !</p>
              </div>
              <div className="flex gap-3">
                {success && (
                  <a href={success} target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Ouvrir dans Spotify
                  </a>
                )}
                <button onClick={() => setSuccess(null)} className="btn-secondary">Continuer</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 flex-1 min-w-0 overflow-hidden">
                  <div className="flex -space-x-2 shrink-0">
                    {selected.slice(0, 4).map(t => (
                      <img
                        key={t.id}
                        src={t.album.images?.[0]?.url || ''}
                        alt=""
                        className="w-8 h-8 rounded-md border-2 border-bg-surface object-cover cursor-pointer hover:scale-110 transition-transform"
                        onClick={() => onRemove(t.id)}
                        title={`Retirer: ${t.name}`}
                      />
                    ))}
                    {selected.length > 4 && (
                      <div className="w-8 h-8 rounded-md border-2 border-bg-surface bg-bg-overlay flex items-center justify-center text-xs text-[--text-secondary]">
                        +{selected.length - 4}
                      </div>
                    )}
                  </div>
                  <span className="text-[--text-secondary] text-sm">
                    <span className="text-white font-semibold">{selected.length}</span> morceau{selected.length > 1 ? 'x' : ''}
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  {targetPlaylist ? (
                    <div className="px-4 py-2 rounded-full bg-accent/10 border border-accent/20 text-sm text-white">
                      Playlist cible : <span className="font-semibold">{targetPlaylist.name}</span>
                    </div>
                  ) : (
                    <select
                      value={playlistId}
                      onChange={e => setPlaylistId(e.target.value)}
                      className="bg-bg-raised border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-accent/50 min-w-[220px]"
                      disabled={playlistLoading}
                    >
                      <option value="">Choisir une playlist…</option>
                      {playlists.map(pl => (
                        <option key={pl.id} value={pl.id}>{pl.name}</option>
                      ))}
                    </select>
                  )}

                  <Button onClick={handleAddToPlaylist} disabled={loading || (!targetPlaylist && !playlistId)} loading={loading} variant="secondary">
                    Ajouter à la playlist
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto flex-wrap items-center">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ou créer une nouvelle playlist…"
                  className="bg-bg-raised border border-white/10 rounded-full px-4 py-2 text-sm text-white placeholder:text-[--text-muted] focus:outline-none focus:border-accent/50 w-full sm:w-72"
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                <Button onClick={handleCreate} disabled={!name.trim()} loading={loading}>
                  Créer sur Spotify
                </Button>
                <button onClick={onClear} className="btn-icon w-9 h-9 text-[--text-muted] hover:text-red-400 text-sm">✕</button>
              </div>

              {error && <p className="text-red-400 text-xs w-full">{error}</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
