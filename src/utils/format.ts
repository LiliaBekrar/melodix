/**
 * utils/format.ts
 * Fonctions utilitaires de formatage
 */

/** Durée en ms → "3:45" */
export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Nombre → "1 234" avec séparateurs */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('fr-FR').format(n)
}

/** Capitalise la première lettre */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Déduplique un tableau par une clé */
export function uniqueBy<T>(arr: T[], key: keyof T): T[] {
  const seen = new Set()
  return arr.filter(item => {
    const k = item[key]
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** Mélange un tableau (Fisher-Yates) */
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Analyse les genres dominants d'une liste d'artistes */
export function getDominantGenres(genres: string[][]): string[] {
  const counts: Record<string, number> = {}
  genres.flat().forEach(g => { counts[g] = (counts[g] || 0) + 1 })
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([g]) => g)
}

/** Injecte les CSS variables depuis le thème au démarrage */
export function injectCssVars(vars: Record<string, string>): void {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}
