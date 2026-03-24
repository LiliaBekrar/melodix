/**
 * LandingPage.tsx
 * Landing immersive avec mini file de lecture stylisée
 */

import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui'
import appConfig from '@/config/appConfig'

const FEATURES = [
  {
    icon: '✦',
    title: 'Créateur de Playlist',
    desc: 'Répondez à quelques questions et obtenez une sélection qui colle mieux à votre humeur du moment.',
    color: 'from-accent/25 via-accent/10 to-transparent',
  },
  {
    icon: '◎',
    title: 'Découverte d’artistes',
    desc: 'Trouvez des artistes qui prolongent vos goûts sans recycler toujours les mêmes noms.',
    color: 'from-blue-500/25 via-blue-500/10 to-transparent',
  },
  {
    icon: '⊕',
    title: 'Playlist Doctor',
    desc: 'Analysez une playlist, ajoutez des titres plus malins et rééquilibrez son énergie.',
    color: 'from-purple-500/25 via-purple-500/10 to-transparent',
  },
]

const QUEUE_ITEMS = [
  { title: 'Velvet Afterglow', artist: 'Olivia Dean', time: '3:12', accent: 'from-accent/30 to-accent/10' },
  { title: 'Night Drive', artist: 'RAYE', time: '2:58', accent: 'from-fuchsia-500/25 to-white/5' },
  { title: 'Hidden Lights', artist: 'Jorja Smith', time: '3:44', accent: 'from-sky-500/25 to-white/5' },
  { title: 'Soft Orbit', artist: 'Sault', time: '4:01', accent: 'from-white/10 to-white/5' },
]

export function LandingPage() {
  const { login, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-bg-base flex flex-col overflow-hidden">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 left-[8%] w-[32rem] h-[32rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-[22%] right-[5%] w-[28rem] h-[28rem] rounded-full bg-fuchsia-500/10 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 w-[24rem] h-[24rem] rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent_22%)]" />
      </div>

      <header className="page-container pt-8 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 backdrop-blur flex items-center justify-center text-xl shadow-lg">
            {appConfig.appEmoji}
          </div>
          <div>
            <p className="font-display font-bold text-white text-xl leading-none">{appConfig.appName}</p>
            <p className="text-[--text-muted] text-xs mt-1">{appConfig.appTagline}</p>
          </div>
        </div>
      </header>

      <section className="page-container relative z-10 pt-14 pb-20 grid lg:grid-cols-[1.15fr_0.85fr] gap-12 items-center flex-1">
        <div>
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-8 animate-fade-in backdrop-blur">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-white/90 text-xs font-medium">Pensé pour rendre Spotify plus vivant, pas plus compliqué</span>
          </div>

          <h1 className="font-display font-extrabold text-5xl sm:text-7xl text-white leading-[0.95] mb-6 animate-slide-up">
            Donne une <span className="text-gradient">vraie allure</span><br />
            à ta prochaine session d’écoute.
          </h1>

          <p className="text-[--text-secondary] text-lg sm:text-xl max-w-2xl leading-relaxed mb-10 animate-slide-up" style={{ animationDelay: '0.08s' }}>
            Crée des playlists plus inspirées, repêche les bons morceaux au lieu des copies carbone,
            et transforme tes habitudes Spotify en terrain de jeu beaucoup plus stylé.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <Button onClick={login} loading={isLoading} size="lg">
              <SpotifyIcon />
              Commencer avec Spotify
            </Button>
            <a href="#features" className="btn-secondary text-base px-8 py-3.5">
              Voir les outils
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-3 animate-slide-up" style={{ animationDelay: '0.22s' }}>
            <StatChip value="3" label="outils utiles" />
            <StatChip value="1 clic" label="pour relancer un morceau" />
            <StatChip value="0 prise de tête" label="sur la création" />
          </div>
        </div>

        <div className="relative animate-slide-up" style={{ animationDelay: '0.12s' }}>
          <div className="absolute -inset-8 rounded-[2.2rem] bg-gradient-to-br from-accent/15 via-white/5 to-fuchsia-500/10 blur-3xl" />

          <div className="relative rounded-[2rem] border border-white/10 bg-white/[0.05] backdrop-blur-2xl p-5 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[--text-muted] text-xs uppercase tracking-[0.22em]">Lecture guidée</p>
                <h2 className="font-display font-bold text-white text-2xl mt-2">Une file plus fine, moins automatique</h2>
              </div>
              <div className="w-11 h-11 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center text-white">
                ▶
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-black/20 px-4 py-4 mb-4">
              <div className="flex items-center gap-3 mb-4">
                <Pill>Chill</Pill>
                <Pill>Audacieux</Pill>
                <Pill>Énergie moyenne</Pill>
              </div>

              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full w-[62%] rounded-full bg-gradient-to-r from-accent via-fuchsia-400 to-sky-400" />
              </div>

              <div className="flex justify-between text-[11px] text-[--text-muted] mt-2 uppercase tracking-[0.14em]">
                <span>mood</span>
                <span>62%</span>
              </div>
            </div>

            <div className="grid gap-3">
              {QUEUE_ITEMS.map((item, index) => (
                <QueueItem
                  key={item.title}
                  title={item.title}
                  artist={item.artist}
                  time={item.time}
                  accent={item.accent}
                  active={index === 0}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="page-container pb-24 relative z-10">
        <div className="flex items-end justify-between gap-4 mb-10 flex-wrap">
          <div>
            <p className="text-[--text-muted] uppercase tracking-[0.2em] text-xs mb-3">Les outils</p>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-white">Trois portes d’entrée, une seule ambiance</h2>
          </div>
          <p className="text-[--text-secondary] max-w-xl">Crée, découvre et améliore tes playlists.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map(({ icon, title, desc, color }, i) => (
            <div key={title} className="card p-6 bg-gradient-to-br animate-slide-up" style={{ animationDelay: `${0.08 * i}s` }}>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${color} border border-white/10 flex items-center justify-center text-xl mb-5`}>
                {icon}
              </div>
              <h3 className="font-display font-bold text-white text-xl mb-2">{title}</h3>
              <p className="text-[--text-secondary] text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="page-container py-8 border-t border-white/[0.06] text-center relative z-10">
        <p className="text-[--text-muted] text-sm">
          {appConfig.appName} {appConfig.footerText}
        </p>
      </footer>
    </div>
  )
}

function QueueItem({
  title,
  artist,
  time,
  accent,
  active = false,
}: {
  title: string
  artist: string
  time: string
  accent: string
  active?: boolean
}) {
  return (
    <div className={`rounded-[1.3rem] border ${active ? 'border-accent/25 bg-white/[0.08]' : 'border-white/10 bg-white/[0.04]'} p-3`}>
      <div className="flex items-center gap-3">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${accent} border border-white/10 shrink-0`} />
        <div className="min-w-0 flex-1">
          <div className="text-white font-display font-bold truncate">{title}</div>
          <div className="text-[--text-secondary] text-sm truncate">{artist}</div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-[--text-muted] text-xs">{time}</span>
          <span className={`w-9 h-9 rounded-full flex items-center justify-center ${active ? 'bg-accent/20 border border-accent/30 text-white' : 'bg-white/5 border border-white/10 text-white/85'}`}>
            ▶
          </span>
        </div>
      </div>
    </div>
  )
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/90">
      {children}
    </span>
  )
}

function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-full border border-white/10 bg-white/5 backdrop-blur px-4 py-2.5 min-w-[150px]">
      <div className="text-white font-display font-bold text-lg leading-none">{value}</div>
      <div className="text-[--text-muted] text-xs mt-1">{label}</div>
    </div>
  )
}

function SpotifyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  )
}