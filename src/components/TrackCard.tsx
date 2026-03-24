/**
 * TrackCard.tsx
 * Carte d'un morceau avec preview audio et sélection
 */

import { usePlayer } from '@/hooks/usePlayer'
import type { TrackItem } from '@/types/spotify'
import { formatDuration } from '@/utils/format'

interface TrackCardProps {
  track: TrackItem
  onSelect?: (track: TrackItem) => void
  onIgnore?: (trackId: string) => void
  showIgnore?: boolean
  compact?: boolean
}

export function TrackCard({ track, onSelect, onIgnore, showIgnore, compact }: TrackCardProps) {
  const { toggleTrack, isPlaying } = usePlayer()
  const playing = isPlaying(track.id)
  const image = track.album.images?.[0]?.url || ''
  const artist = track.artists.map(a => a.name).join(', ')
  const hasPreview = Boolean(track.preview_url)

  function openOnSpotify() {
    const url = track.external_urls?.spotify
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

  function handlePlay(e: React.MouseEvent) {
    e.stopPropagation()
    if (!track.preview_url) {
      openOnSpotify()
      return
    }
    toggleTrack(track.id, track.preview_url, track.name, artist, image)
  }

  return (
    <div
      className={`card group flex ${compact ? 'items-center gap-3 p-3' : 'flex-col p-0 overflow-hidden h-full'} ${track.selected ? 'card-active' : ''} cursor-pointer`}
      onClick={() => onSelect?.(track)}
    >
      <div className={`relative shrink-0 ${compact ? 'w-12 h-12 rounded-lg overflow-hidden' : 'w-full aspect-square overflow-hidden'}`}>
        {image
          ? <img src={image} alt={track.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          : <div className="w-full h-full bg-bg-overlay flex items-center justify-center text-2xl">🎵</div>
        }

        <button
          onClick={handlePlay}
          title={hasPreview ? "Écouter l'extrait" : 'Ouvrir dans Spotify'}
          className={`absolute inset-0 flex items-center justify-center transition-all cursor-pointer ${compact ? 'bg-black/28 opacity-100' : 'bg-transparent opacity-100 hover:bg-black/20'}`}
        >
          <span className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${playing ? 'bg-accent text-bg-base shadow-[0_0_0_8px_rgba(29,185,84,0.16)] scale-105' : 'bg-white/12 text-white border border-white/25 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-accent hover:text-bg-base hover:border-accent hover:shadow-[0_0_0_10px_rgba(29,185,84,0.18)] hover:scale-105'}`}>
            {playing ? <PauseIcon /> : <PlayIcon />}
          </span>
        </button>

        {playing && (
          <div className="absolute bottom-2 left-2 flex gap-0.5 items-end">
            {[1, 2, 3].map(i => (
              <span
                key={i}
                className="w-1 bg-accent rounded-full animate-pulse"
                style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        )}
      </div>

      <div className={`flex-1 min-w-0 ${compact ? '' : 'p-3 pt-2 flex flex-col'}`}>
        <p className="font-display font-semibold text-white text-sm truncate">{track.name}</p>
        <p className="text-[--text-secondary] text-xs truncate mt-0.5">{artist}</p>
        {!compact && (
          <>
            <p className="text-[--text-muted] text-xs mt-1">{track.album.name} · {formatDuration(track.duration_ms)}</p>
            <div className="mt-3">
              <button
                onClick={(e) => { e.stopPropagation(); openOnSpotify() }}
                className="text-xs text-[--text-secondary] hover:text-white transition-colors inline-flex items-center gap-1"
              >
                <span>↗</span>
                <span>Ouvrir sur Spotify</span>
              </button>
            </div>
          </>
        )}
      </div>

      <div
        className={`flex items-stretch gap-2 shrink-0 ${compact ? '' : 'px-3 pb-3 mt-auto w-full'}`}
        onClick={e => e.stopPropagation()}
      >
        {onSelect && (
          <button
            onClick={(e) => { e.stopPropagation(); onSelect(track) }}
            className={`btn flex-1 h-[48px] text-sm px-4 ${track.selected ? 'bg-accent text-bg-base' : 'btn-secondary'}`}
          >
            {track.selected ? '✓ Ajouté' : '+ Ajouter'}
          </button>
        )}
        {showIgnore && onIgnore && (
          <button
            onClick={(e) => { e.stopPropagation(); onIgnore(track.id) }}
            className="btn-icon size-12 min-w-12 min-h-12 text-[--text-muted] hover:text-red-400 text-base shrink-0 rounded-full border border-white/10 bg-white/5 hover:bg-white/10"
            title="Remplacer cette proposition"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  )
}

function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
    </svg>
  )
}
