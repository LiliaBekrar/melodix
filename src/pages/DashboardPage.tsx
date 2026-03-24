/**
 * DashboardPage.tsx
 * Tableau de bord principal après connexion
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getTopTracks, getTopArtists } from '@/services/spotifyApi'
import { TrackCard } from '@/components/TrackCard'
import { Skeleton, EmptyState } from '@/components/ui'
import type { SpotifyTrack, SpotifyArtist } from '@/types/spotify'
import { formatNumber } from '@/utils/format'

const TOOLS = [
  {
    to: '/create',
    icon: '✦',
    title: 'Créateur de Playlist',
    desc: 'Questionnaire → playlist sur mesure',
    gradient: 'from-accent/20 via-accent/5 to-transparent',
    border: 'hover:border-accent/30',
  },
  {
    to: '/discover',
    icon: '◎',
    title: 'Découvrir des Artistes',
    desc: 'Nouveaux artistes selon vos goûts',
    gradient: 'from-blue-500/20 via-blue-500/5 to-transparent',
    border: 'hover:border-blue-500/30',
  },
  {
    to: '/doctor',
    icon: '⊕',
    title: 'Playlist Doctor',
    desc: 'Analysez et enrichissez vos playlists',
    gradient: 'from-purple-500/20 via-purple-500/5 to-transparent',
    border: 'hover:border-purple-500/30',
  },
]

export function DashboardPage() {
  const { user } = useAuth()
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [artists, setArtists] = useState<SpotifyArtist[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTopTracks('short_term', 6),
      getTopArtists('medium_term', 8),
    ]).then(([t, a]) => {
      setTracks(t)
      setArtists(a)
    }).catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir'

  return (
    <div className="page-container py-10 space-y-12">
      {/* Welcome */}
      <div className="animate-fade-in">
        <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-white mb-1">
          {greeting}, <span className="text-gradient">{user?.display_name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-[--text-secondary]">Que voulez-vous faire aujourd'hui ?</p>
      </div>

      {/* Tools */}
      <section>
        <div className="grid sm:grid-cols-3 gap-4">
          {TOOLS.map(({ to, icon, title, desc, gradient, border }, i) => (
            <Link
              key={to} to={to}
              className={`card p-6 bg-gradient-to-br ${gradient} border ${border} transition-all duration-300 animate-slide-up`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <span className="text-3xl block mb-3">{icon}</span>
              <h2 className="font-display font-bold text-white text-lg mb-1">{title}</h2>
              <p className="text-[--text-secondary] text-sm">{desc}</p>
              <span className="mt-4 inline-flex items-center text-xs text-accent gap-1">
                Commencer <span>→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Tracks */}
      <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Vos titres récents</h2>
          <span className="text-[--text-muted] text-xs">4 dernières semaines</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : tracks.length === 0 ? (
          <EmptyState icon="🎵" title="Pas encore de données" description="Écoutez de la musique sur Spotify pour voir vos statistiques ici." />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {tracks.map((track, i) => (
              <TrackCard
                key={track.id}
                track={track}
              />
            ))}
          </div>
        )}
      </section>

      {/* Top Artists */}
      <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="section-title mb-0">Vos artistes favoris</h2>
          <span className="text-[--text-muted] text-xs">Toutes périodes</span>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-hidden">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 shrink-0 w-24">
                <Skeleton className="w-20 h-20 rounded-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : artists.length === 0 ? (
          <EmptyState icon="🎤" title="Aucun artiste trouvé" />
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4">
            {artists.map((artist) => (
              <a
                key={artist.id}
                href={artist.external_urls.spotify}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group"
              >
                <div className="relative w-full aspect-square rounded-full overflow-hidden">
                  {artist.images?.[0]?.url
                    ? <img src={artist.images[0].url} alt={artist.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    : <div className="w-full h-full bg-bg-overlay flex items-center justify-center text-xl">🎤</div>
                  }
                  <div className="absolute inset-0 rounded-full border-2 border-transparent group-hover:border-accent/50 transition-colors" />
                </div>
                <p className="text-xs text-[--text-secondary] group-hover:text-white transition-colors text-center truncate w-full">
                  {artist.name}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>

      {/* Stats */}
      {user && (
        <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <StatCard label="Abonnés" value={user.followers ? formatNumber(user.followers.total) : '—'} />
          <StatCard label="Plan" value={user.product ? (user.product === 'premium' ? 'Premium ✓' : 'Free') : '—'} />
          <StatCard label="Pays" value={user.country ?? '—'} />
        </section>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <p className="text-[--text-muted] text-xs mb-1">{label}</p>
      <p className="font-display font-bold text-white text-lg">{value}</p>
    </div>
  )
}
