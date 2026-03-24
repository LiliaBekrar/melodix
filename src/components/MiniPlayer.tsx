/**
 * MiniPlayer.tsx
 * Lecteur audio flottant en bas de page
 */

import { usePlayer } from '@/hooks/usePlayer'

export function MiniPlayer() {
  const { player, pauseTrack, playTrack } = usePlayer()

  if (!player.trackId) return null

  const toggle = () => {
    if (player.isPlaying) {
      pauseTrack()
    } else if (player.previewUrl) {
      playTrack(player.trackId!, player.previewUrl, player.trackName, player.artistName, player.albumImage)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
      <div className="bg-bg-surface/95 backdrop-blur-xl border-t border-white/10 px-4 py-3">
        <div className="page-container flex items-center gap-4">
          {/* Cover */}
          {player.albumImage && (
            <img src={player.albumImage} alt="" className="w-10 h-10 rounded-lg shrink-0 object-cover" />
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="font-display font-semibold text-white text-sm truncate">{player.trackName}</p>
            <p className="text-[--text-secondary] text-xs truncate">{player.artistName}</p>
          </div>

          {/* Preview badge */}
          <span className="text-[--text-muted] text-xs hidden sm:block">Extrait 30s</span>

          {/* Controls */}
          <button onClick={toggle} className="btn-icon w-10 h-10 text-white">
            {player.isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        {/* Progress bar simulée */}
        {player.isPlaying && (
          <div className="h-0.5 bg-bg-overlay mt-2 overflow-hidden">
            <div className="h-full bg-accent rounded-full animate-[grow_30s_linear]" />
          </div>
        )}
      </div>
    </div>
  )
}
