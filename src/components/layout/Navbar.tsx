/**
 * Navbar.tsx
 */

import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import appConfig from '@/config/appConfig'

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard', icon: '⊞' },
  { to: '/create',    label: 'Créer',      icon: '✦' },
  { to: '/discover',  label: 'Découvrir',  icon: '◎' },
  { to: '/doctor',    label: 'Doctor',     icon: '⊕' },
]

export function Navbar() {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 bg-bg-base/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="page-container flex items-center h-16 gap-6">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
          <span className="text-xl">{appConfig.appEmoji}</span>
          <span className="font-display font-bold text-white text-lg">{appConfig.appName}</span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1 flex-1">
          {NAV_LINKS.map(({ to, label, icon }) => (
            <Link
              key={to} to={to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                pathname === to || pathname.startsWith(to + '/')
                  ? 'bg-accent/10 text-accent'
                  : 'text-[--text-secondary] hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{icon}</span>{label}
            </Link>
          ))}
        </div>

        {/* User */}
        {user && (
          <div className="flex items-center gap-3 ml-auto">
            <div className="hidden sm:flex items-center gap-2">
              {user.images?.[0]?.url
                ? <img src={user.images[0].url} alt="" className="w-7 h-7 rounded-full object-cover" />
                : <div className="w-7 h-7 rounded-full bg-accent/20 flex items-center justify-center text-accent text-xs font-bold">{user.display_name[0]}</div>
              }
              <span className="text-sm text-[--text-secondary] hidden lg:block">{user.display_name}</span>
            </div>
            <button onClick={logout} className="btn-ghost px-3 py-1.5 text-xs text-[--text-muted]">
              Déconnexion
            </button>
          </div>
        )}
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden border-t border-white/[0.06] px-2 pb-1">
        {NAV_LINKS.map(({ to, label, icon }) => (
          <Link
            key={to} to={to}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs transition-colors ${
              pathname === to ? 'text-accent' : 'text-[--text-muted]'
            }`}
          >
            <span className="text-base">{icon}</span>{label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
