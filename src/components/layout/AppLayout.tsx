/**
 * AppLayout.tsx
 * Layout principal avec navbar et mini player
 */

import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'
import { MiniPlayer } from '@/components/MiniPlayer'
import { usePlayer } from '@/hooks/usePlayer'

export function AppLayout() {
  const { player } = usePlayer()
  const hasPlayer = !!player.trackId

  return (
    <div className="min-h-screen bg-bg-base">
      <Navbar />
      <main
        className="pt-16 md:pt-16"
        style={{ paddingBottom: hasPlayer ? 'calc(var(--player-height) + 1rem)' : '2rem' }}
      >
        <Outlet />
      </main>
      <MiniPlayer />
    </div>
  )
}
