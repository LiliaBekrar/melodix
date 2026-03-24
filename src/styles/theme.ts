/**
 * ============================================================
 *  FICHIER DE CONFIGURATION DU THÈME — MODIFIEZ ICI
 * ============================================================
 * Toutes les valeurs visuelles de l'application sont centralisées ici.
 * Ce fichier alimente Tailwind (tailwind.config.js) et les CSS variables (useTheme.ts).
 */

export const colors = {
  bg: {
    base:    '#0f0f0f',
    surface: '#1a1a1a',
    raised:  '#242424',
    overlay: '#2e2e2e',
  },
  accent: {
    DEFAULT: '#1DB954',
    hover:   '#1ed760',
    muted:   '#17a84a',
    glow:    'rgba(29, 185, 84, 0.2)',
  },
  text: {
    primary:   '#ffffff',
    secondary: '#a0a0a0',
    muted:     '#555555',
    inverse:   '#0f0f0f',
  },
  state: {
    success: '#1DB954',
    warning: '#f59e0b',
    error:   '#ef4444',
    info:    '#3b82f6',
  },
  border: {
    subtle:  'rgba(255,255,255,0.06)',
    DEFAULT: 'rgba(255,255,255,0.12)',
    strong:  'rgba(255,255,255,0.24)',
  },
} as const

export const typography = {
  fontFamily: {
    display: '"Plus Jakarta Sans", sans-serif',
    body:    '"DM Sans", sans-serif',
    mono:    '"JetBrains Mono", monospace',
  },
} as const

export const layout = {
  maxWidth:     '1280px',
  navHeight:    '64px',
  playerHeight: '80px',
} as const

export const shadows = {
  card:   '0 2px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)',
  lg:     '0 8px 32px rgba(0,0,0,0.7)',
  accent: '0 0 24px rgba(29,185,84,0.25)',
} as const

export const theme = { colors, typography, layout, shadows } as const
export default theme
