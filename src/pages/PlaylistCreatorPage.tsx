/**
 * PlaylistCreatorPage.tsx
 * Outil 1 : Créateur de playlist basé sur un questionnaire
 */

import { useState } from 'react'
import { getTopTracks, getTopArtists, getPlaylistCreatorTracks } from '@/services/spotifyApi'
import { TrackCard } from '@/components/TrackCard'
import { SelectionBar } from '@/components/SelectionBar'
import { Button, Skeleton, EmptyState } from '@/components/ui'
import type { TrackItem, PlaylistCreatorAnswers } from '@/types/spotify'

// ── Questionnaire data ────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    key: 'moment' as const,
    label: 'Pour quel moment ?',
    emoji: '🕐',
    options: [
      { value: 'chill', label: 'Chill', emoji: '😌' },
      { value: 'voiture', label: 'Voiture', emoji: '🚗' },
      { value: 'sport', label: 'Sport', emoji: '🏃' },
      { value: 'focus', label: 'Focus / Travail', emoji: '🎯' },
      { value: 'soiree', label: 'Soirée', emoji: '🌙' },
    ],
  },
  {
    key: 'energy' as const,
    label: 'Niveau d\'énergie ?',
    emoji: '⚡',
    options: [
      { value: 'faible', label: 'Faible', emoji: '🌿' },
      { value: 'moyen', label: 'Moyen', emoji: '🔥' },
      { value: 'eleve', label: 'Élevé', emoji: '⚡' },
    ],
  },
  {
    key: 'preference' as const,
    label: 'Votre préférence ?',
    emoji: '🎯',
    options: [
      { value: 'proche', label: 'Proche de mes goûts', emoji: '❤️' },
      { value: 'mix', label: 'Mix découverte', emoji: '🔀' },
      { value: 'audacieux', label: 'Plus audacieux', emoji: '🚀' },
    ],
  },
] as const

const EXCLUSIONS = [
  { value: 'trop triste', label: 'Trop triste', emoji: '😢' },
  { value: 'trop lent', label: 'Trop lent', emoji: '🐢' },
  { value: 'trop agressif', label: 'Trop agressif', emoji: '😤' },
  { value: 'trop commercial', label: 'Trop commercial', emoji: '📺' },
]

// ── Component ─────────────────────────────────────────────────────────────────

export function PlaylistCreatorPage() {
  const [answers, setAnswers] = useState<PlaylistCreatorAnswers>({
    moment: null, energy: null, preference: null, exclusions: [],
  })
  const [tracks, setTracks] = useState<TrackItem[]>([])
  const [reserveTracks, setReserveTracks] = useState<TrackItem[]>([])
  const [selected, setSelected] = useState<TrackItem[]>([])
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'form' | 'results'>('form')

  async function generate() {
    setLoading(true)
    try {
      const [topTracks, topArtists] = await Promise.all([
        getTopTracks('short_term', 10),
        getTopArtists('short_term', 5),
      ])
      const results = await getPlaylistCreatorTracks({
        ...answers,
        seedTracks: topTracks.map(t => t.id),
        seedArtists: topArtists.map(a => a.id),
      })
      const uniqueResults = results.filter((track, index, arr) => arr.findIndex(t => t.id === track.id) === index)
      setTracks(uniqueResults.slice(0, 20))
      setReserveTracks(uniqueResults.slice(20))
      setSelected([])
      setStep('results')
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  function toggleSelect(track: TrackItem) {
    setTracks(prev => prev.map(t => t.id === track.id ? { ...t, selected: !t.selected } : t))
    setSelected(prev => {
      const exists = prev.find(t => t.id === track.id)
      return exists ? prev.filter(t => t.id !== track.id) : [...prev, { ...track, selected: true }]
    })
  }

  function replaceTrack(trackId: string) {
    const replacement = reserveTracks.find(track => track.id !== trackId) ?? null

    if (replacement) {
      setReserveTracks(prev => prev.filter(track => track.id !== replacement.id))
      setTracks(prev => prev.map(track =>
        track.id === trackId ? { ...replacement, selected: false } : track
      ))
    } else {
      setTracks(prev => prev.filter(track => track.id !== trackId))
    }

    setSelected(prev => prev.filter(track => track.id !== trackId))
  }

  function removeSelected(id: string) {
    setSelected(prev => prev.filter(t => t.id !== id))
    setTracks(prev => prev.map(t => t.id === id ? { ...t, selected: false } : t))
  }

  const canGenerate = answers.moment && answers.energy && answers.preference

  return (
    <div className="page-container py-10">
      {/* Header */}
      <div className="mb-10 animate-fade-in">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-3xl">✦</span>
          <h1 className="font-display font-extrabold text-3xl text-white">Créateur de Playlist</h1>
        </div>
        <p className="text-[--text-secondary]">Répondez aux questions pour obtenir une playlist personnalisée.</p>
      </div>

      {step === 'form' ? (
        <div className="max-w-2xl space-y-8 animate-slide-up">
          {/* Questions */}
          {QUESTIONS.map(({ key, label, emoji, options }) => (
            <div key={key}>
              <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
                <span>{emoji}</span> {label}
              </h3>
              <div className="flex flex-wrap gap-3">
                {options.map(({ value, label: optLabel, emoji: optEmoji }) => (
                  <button
                    key={value}
                    onClick={() => setAnswers(prev => ({ ...prev, [key]: value as never }))}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm font-medium transition-all duration-200 ${
                      answers[key] === value
                        ? 'bg-accent text-bg-base border-accent'
                        : 'bg-bg-raised border-white/10 text-[--text-secondary] hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{optEmoji}</span> {optLabel}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Exclusions */}
          <div>
            <h3 className="font-display font-semibold text-white mb-4 flex items-center gap-2">
              <span>🚫</span> Exclure (optionnel)
            </h3>
            <div className="flex flex-wrap gap-3">
              {EXCLUSIONS.map(({ value, label, emoji }) => (
                <button
                  key={value}
                  onClick={() => setAnswers(prev => ({
                    ...prev,
                    exclusions: prev.exclusions.includes(value)
                      ? prev.exclusions.filter(e => e !== value)
                      : [...prev.exclusions, value],
                  }))}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-sm transition-all duration-200 ${
                    answers.exclusions.includes(value)
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-bg-raised border-white/10 text-[--text-secondary] hover:border-white/20'
                  }`}
                >
                  <span>{emoji}</span> {label}
                </button>
              ))}
            </div>
          </div>

          <Button onClick={generate} loading={loading} disabled={!canGenerate} size="lg">
            Générer ma playlist
          </Button>
          {!canGenerate && (
            <p className="text-[--text-muted] text-xs">Répondez aux 3 premières questions pour continuer.</p>
          )}
        </div>
      ) : (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-display font-bold text-xl text-white">
                {tracks.length} morceaux recommandés
              </h2>
              <p className="text-[--text-secondary] text-sm mt-1">
                Cliquez sur un morceau pour l’ajouter. ✕ remplace la proposition par une autre.
              </p>
            </div>
            <button onClick={() => { setStep('form'); setTracks([]); setReserveTracks([]); setSelected([]) }} className="btn-ghost text-sm">
              ← Recommencer
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array(15).fill(0).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="aspect-square w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ))}
            </div>
          ) : tracks.length === 0 ? (
            <EmptyState icon="🎵" title="Aucun résultat" description="Essayez différentes options." action={
              <button onClick={() => setStep('form')} className="btn-secondary">Réessayer</button>
            } />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pb-32">
              {tracks.map(track => (
                <TrackCard
                  key={track.id}
                  track={track}
                  onSelect={toggleSelect}
                  onIgnore={replaceTrack}
                  showIgnore
                />
              ))}
            </div>
          )}
        </div>
      )}

      <SelectionBar
        selected={selected}
        onRemove={removeSelected}
        onClear={() => { setSelected([]); setTracks(prev => prev.map(t => ({ ...t, selected: false }))) }}
      />
    </div>
  )
}
