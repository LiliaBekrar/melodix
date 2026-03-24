/**
 * usePlayer.ts
 * Gestion du player audio global (preview 30 secondes)
 */

import { createContext, useContext, useState, useRef, useCallback, createElement, type ReactNode } from 'react'
import type { PlayerState } from '@/types/spotify'

interface PlayerContextValue {
  player: PlayerState
  playTrack: (trackId: string, previewUrl: string, name: string, artist: string, image: string) => void
  pauseTrack: () => void
  toggleTrack: (trackId: string, previewUrl: string, name: string, artist: string, image: string) => void
  isPlaying: (trackId: string) => boolean
}

const defaultPlayer: PlayerState = {
  trackId: null, previewUrl: null, isPlaying: false,
  trackName: '', artistName: '', albumImage: '',
}

const PlayerContext = createContext<PlayerContextValue | null>(null)

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [player, setPlayer] = useState<PlayerState>(defaultPlayer)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stopCurrent = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
  }, [])

  const playTrack = useCallback((
    trackId: string, previewUrl: string,
    name: string, artist: string, image: string
  ) => {
    stopCurrent()
    const audio = new Audio(previewUrl)
    audioRef.current = audio
    audio.volume = 0.7
    audio.play().catch(console.error)
    audio.onended = () => setPlayer(p => ({ ...p, isPlaying: false }))
    setPlayer({ trackId, previewUrl, isPlaying: true, trackName: name, artistName: artist, albumImage: image })
  }, [stopCurrent])

  const pauseTrack = useCallback(() => {
    audioRef.current?.pause()
    setPlayer(p => ({ ...p, isPlaying: false }))
  }, [])

  const toggleTrack = useCallback((
    trackId: string, previewUrl: string,
    name: string, artist: string, image: string
  ) => {
    if (player.trackId === trackId && player.isPlaying) {
      pauseTrack()
    } else if (player.trackId === trackId && !player.isPlaying) {
      audioRef.current?.play().catch(console.error)
      setPlayer(p => ({ ...p, isPlaying: true }))
    } else {
      playTrack(trackId, previewUrl, name, artist, image)
    }
  }, [player, playTrack, pauseTrack])

  const isPlaying = useCallback(
    (trackId: string) => player.trackId === trackId && player.isPlaying,
    [player]
  )

  return (
    <PlayerContext.Provider value={{ player, playTrack, pauseTrack, toggleTrack, isPlaying }}>
      {children}
    </PlayerContext.Provider>
  )
}

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext)
  if (!ctx) throw new Error('usePlayer doit être utilisé dans PlayerProvider')
  return ctx
}
