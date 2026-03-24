/**
 * ui/index.tsx
 * Composants UI réutilisables
 */

import { type ReactNode, type ButtonHTMLAttributes } from 'react'

// ── Spinner ───────────────────────────────────────────────────────────────────

export function Spinner({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      className={`animate-spin text-accent ${className}`}
      fill="none" xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

// ── Button ────────────────────────────────────────────────────────────────────

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
  children: ReactNode
}

const variantClass = {
  primary:   'btn-primary',
  secondary: 'btn-secondary',
  ghost:     'btn-ghost',
  danger:    'btn bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-5 py-2.5 text-sm',
}
const sizeClass = { sm: 'text-xs px-4 py-1.5', md: '', lg: 'text-base px-8 py-3.5' }

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: BtnProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`${variantClass[variant]} ${sizeClass[size]} ${className} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {loading ? <Spinner size={16} /> : icon}
      {children}
    </button>
  )
}

// ── Badge ─────────────────────────────────────────────────────────────────────

export function Badge({ children, variant = 'default' }: {
  children: ReactNode
  variant?: 'default' | 'accent' | 'success' | 'warning' | 'info'
}) {
  const cls = {
    default: 'bg-bg-raised text-[--text-secondary] border-white/10',
    accent:  'bg-accent/10 text-accent border-accent/20',
    success: 'bg-green-500/10 text-green-400 border-green-500/20',
    warning: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    info:    'bg-blue-500/10 text-blue-400 border-blue-500/20',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full border ${cls[variant]}`}>
      {children}
    </span>
  )
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} />
}

// ── Empty State ───────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description, action }: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
      <div className="text-4xl opacity-40">{icon}</div>
      <div>
        <p className="font-display font-semibold text-white/70 text-lg">{title}</p>
        {description && <p className="text-[--text-muted] text-sm mt-1">{description}</p>}
      </div>
      {action}
    </div>
  )
}

// ── Score Bar ─────────────────────────────────────────────────────────────────

export function ScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[--text-secondary] text-sm w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-bg-overlay rounded-full overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-all duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-white text-sm font-mono w-8 text-right">{value}</span>
    </div>
  )
}
